'use client';

import Image from "next/image";
import { SettingsIcon } from "lucide-react";
import Messages from "@/components/Messages";
import Recorder, { mimeType } from "@/components/Recorder";
import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import transcript from "@/actions/transcript";

const initialState = {
  sender: "",
  response: "",
  id: "",
}

export type Message = {
  sender: string;
  response: string;
  id: string;
}

export default function Home() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);
  const [state, formAction] = useFormState(transcript, initialState);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Current state:", state);
    if (state.response && state.sender) {
      setMessages((messages) => [
        {
          sender: state.sender || "",
          response: state.response || "",
          id: state.id || "",
        },
        ...messages,
      ]);
      setError(null);
    } else if (state.response && state.response.startsWith("An error occurred:")) {
      console.error("Transcription error:", state.response);
      setError(state.response);
    }
  }, [state])

  const uploadAudio = (blob: Blob) => {
    const file = new File([blob], "audio.webm", { type: mimeType });

    // Set the file as the value in the hidden input file field
    if (fileRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileRef.current.files = dataTransfer.files;

      if (submitButtonRef.current) {
        submitButtonRef.current?.click();
      }
    }
  }

  console.log("Messages:", messages);

  return (
    <main className="bg-black h-screen overflow-hidden overflow-y-auto">
      <header className="flex justify-between fixed top-0 text-white w-full p-5">
        <div className="relative aspect-square w-10 rounded-full">
          <Image
            className="rounded-full"
            src="https://staticg.sportskeeda.com/editor/2022/03/b99c3-16467631610344-1920.jpg?w=640"
            layout="fill"
            objectFit="cover"
            alt="profile-image"
          />
        </div>

        <SettingsIcon
          size={40}
          className="p-2 rounded-full cursor-pointer bg-blue-600 text-white transition-all ease-in-out duration-150 hover:bg-blue-700/80 hover:rotate-45"
        />
      </header>

      <form action={formAction} className="flex flex-col bg-black">
        <div className="flex-1 bg-gradient-to-b from-blue-500 to-black">
          <Messages messages={messages} />
          {error && (
            <div className="text-red-500 p-4 bg-black/50 mt-4 rounded">
              {error}
            </div>
          )}
        </div>

        <input type="file" name="audio" hidden ref={fileRef} />
        <button type="submit" hidden ref={submitButtonRef} />

        <div className="fixed bottom-0 w-full overflow-hidden bg-black rounded-t-3xl">
          <Recorder uploadAudio={uploadAudio} />

          <div>
            {/* Voice Synth */}
          </div>

        </div>

      </form>
    </main>
  );
}
