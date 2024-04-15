import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import OpenAI from "openai/mod.ts";

export const GenerateAIIncidentSummary = DefineFunction({
  callback_id: "ai_incident_summary",
  title: "generate a summary of an incident",
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

    let OPEN_AI;
    let completionContent = "";
    try {
      OPEN_AI = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });

      const chatCompletion = await OPEN_AI.chat.completions.create({
        messages: [
          {
            "role": "system",
            "content":
              ` summarize the incident and provide answers to the following: 
              Incident Summary:

              Incident Date:
              Incident ID:
              Reported by:
              Severity level:
              Status:
              📝 Incident Description:
              
              What happened? Explain in detail...
              🦷 Root Cause Analysis:
              
              Cause:
              Impact:
              Resolution:
              👍 What Went Well?
              
              Item 1
              Item 2
              👎 What Could Have Gone Better?
              
              Item 1
              Item 2
              Item 3`,
          },
          { "role": "user", "content": `${original_message_text}` },
        ],
        model: "gpt-3.5-turbo",
      });
      completionContent = chatCompletion.choices[0].message.content || "null";
      console.log("completionContent=========>", completionContent);
    } catch (error) {
      console.error(error);
    }

    return {
      outputs: {},
    };
  },
);
