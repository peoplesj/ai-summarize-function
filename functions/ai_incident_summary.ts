import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import OpenAI from "openai/mod.ts";

export const GenerateAIIncidentSummary = DefineFunction({
  callback_id: "ai_incident_summary",
  title: "genereate a summary of an incident",
  description: "Check internal database for a user's mobile information.",
  source_file: "functions/ai_incident_summary.ts",
  input_parameters: {
    properties: {
      timestamp_of_original_message: {
        type: Schema.types.string,
        description: "details about the incident",
      },
      channel_id: {
        type: Schema.types.string,
        description: "The channel that the email was posted.",
      },
    },
    required: ["timestamp_of_original_message", "channel_id"],
  },
  output_parameters: {
    properties: {
      ai_incident_summary: {
        type: Schema.types.string,
        description: "an ai summary of the incident",
      },
    },
    required: [],
  },
});

export default SlackFunction(
  GenerateAIIncidentSummary,
  async ({ client, inputs, env }) => {
    let original_message_text = "";
    try {
      const historyResponse = await client.conversations.history({
        channel: inputs.channel_id,
        oldest: inputs.timestamp_of_original_message,
        inclusive: true,
        limit: 1,
      });
      original_message_text = historyResponse.messages[0].text;
      console.log("email text=======>", original_message_text);
    } catch (error) {
      console.error(error);
    }

    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          "role": "system",
          "content":
            `You are a helpful assistant. Please write a response to the following email in 100 words:`,
        },
        { "role": "user", "content": `${original_message_text}` },
      ],
      model: "gpt-3.5-turbo",
    });

    const completionContent = chatCompletion.choices[0].message.content;

    return {
      outputs: {},
    };
  },
);
