'use server';

import { AzureKeyCredential, ChatRequestMessage, ChatRequestSystemMessage, OpenAIClient } from "@azure/openai";

const env = process.env;

async function transcript(prevState: any, formData: FormData) {
  console.log("PREVIOUS STATE: ", prevState);

  const id = Math.random().toString(36);

  // Log environment variables (be careful not to log the full API key in production)
  console.log("AZURE_ENDPOINT:", env.AZURE_ENDPOINT);
  console.log("AZURE_API_KEY:", env.AZURE_API_KEY ? "Present" : "Missing");
  console.log("AZURE_DEPLOYMENT_NAME:", env.AZURE_DEPLOYMENT_NAME);
  console.log("AZURE_DEPLOYMENT_COMPLETIONS_NAME:", env.AZURE_DEPLOYMENT_COMPLETIONS_NAME);

  if (
    !env.AZURE_API_KEY ||
    !env.AZURE_ENDPOINT ||
    !env.AZURE_DEPLOYMENT_NAME ||
    !env.AZURE_DEPLOYMENT_COMPLETIONS_NAME
  ) {
    const missingCredentials = [
      !env.AZURE_API_KEY && "AZURE_API_KEY",
      !env.AZURE_ENDPOINT && "AZURE_ENDPOINT",
      !env.AZURE_DEPLOYMENT_NAME && "AZURE_DEPLOYMENT_NAME",
      !env.AZURE_DEPLOYMENT_COMPLETIONS_NAME && "AZURE_DEPLOYMENT_COMPLETIONS_NAME"
    ].filter(Boolean).join(", ");

    const errorMessage = `Azure credentials not found: ${missingCredentials}`;
    console.error(errorMessage);
    return {
      sender: "",
      response: errorMessage,
      id
    };
  }

  const file = formData.get("audio") as File;

  if (file.size === 0) {
    return {
      sender: "",
      response: "No audio file found",
      id
    };
  }

  console.log(">>", file);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const audio = new Uint8Array(arrayBuffer);

    console.log("== Transcribe Audio Sample ==");

    const client = new OpenAIClient(
      env.AZURE_ENDPOINT,
      new AzureKeyCredential(env.AZURE_API_KEY)
    );

    console.log("OpenAIClient initialized");

    const result = await client.getAudioTranscription(
      env.AZURE_DEPLOYMENT_NAME,
      audio
    );
    console.log(`Transcription: ${result.text}`);

    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant. You will answer questions and reply I can't answer that if you don't know the answer",
      },
      {
        role: "user",
        content: result.text
      }
    ];

    const completions = await client.getChatCompletions(
      env.AZURE_DEPLOYMENT_COMPLETIONS_NAME,
      messages,
      {
        maxTokens: 128,
      }
    );

    const response = completions.choices[0].message?.content;

    console.log(prevState.sender, "+++", result.text);

    return {
      sender: result.text,
      response: response,
      id,
    };
  } catch (error) {
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    } else {
      errorMessage = String(error);
    }
    console.error("Error in transcript function:", errorMessage);
    return {
      sender: "",
      response: `An error occurred: ${errorMessage}`,
      id,
    };
  }
}

export default transcript;