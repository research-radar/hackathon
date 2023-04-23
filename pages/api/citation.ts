import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Configuration, OpenAIApi } from "openai";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const apiKey = process.env.OPENAI_API_KEY;
  const configuration = new Configuration({
    apiKey,
  });

  const openai = new OpenAIApi(configuration);

  // get request parameters
  const { selectedText } = req.body as {
    selectedText: string;
  };

  console.log(req.body);

  // Generate embedding for selected text

  const input = selectedText.replace(/\n/g, " ");

  const oaRes = await fetch("https://api.openai.com/v1/embeddings", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },

    method: "POST",
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input,
    }),
  });

  const json = await oaRes.json();
  console.log(json);
  const embedding = json.data[0].embedding;

  // Fetch most similar chunk from DB

  const { data: chunks, error } = await supabaseAdmin.rpc("embeddings_search", {
    query_embedding: embedding,
    similarity_threshold: 0.01,
    match_count: 3,
  });

  if (error || chunks.length == 0) {
    console.error(error);
    res.status(500).send("Error fetching similar chunks from database.");
  }

  console.log(chunks);
  const mostSimilarChunk = chunks[0];

  // Send to open AI to find connections and build text for user

  let topics = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an AI Research Citation Assistant; your task is to assist scientists in identifying appropriate citations for their writing. Their writing may consist of primary literature, reviews, or grants. Your primary responsibility is to carefully examine your scientist's written text and compare it with the most similar text chunk found in their collection of sources. When responding you will:

        1. Explain and detail the connections between the user's text and the source chunk, highlighting any similarities, differences or noteworthy points
        
        2. Identify and present relevant quotes (enclosed in quotation marks) from the source chunk that directly supports or relates to the user's text.
        
        LIMIT YOUR RESPONSE TO 100 words. The text will fit in a small sidebar for the user. Include the most relevant points.
        If you are unable to find a relevant citation, you must clearly state "No citation found." However, if a potential citation is identified, provide a thorough explanation of the connections between the user's text and the source chunk, and then ask the user if they would like to cite the chunk in their paper.
        Your input will be provided in the following format: {selectedText: "<USER_WRITTEN_TEXT>", chunk: "<MOST_SIMILAR_SOURCE_CHUNK>" }, and your response should be detailed, context-rich, and tailored to the specific input provided.
    `,
      },
      {
        role: "user",
        content: JSON.stringify({
          selectedText,
          chunk: mostSimilarChunk.content,
        }),
      },
    ],
    max_tokens: 250,
    temperature: 0.6,
  });

  if (!topics) {
    res.status(500).send("Error recieving answer from gpt3.5");
    return;
  }
  let text =
    topics?.data?.choices[0]?.message?.content ??
    "No Content Recieved from OpenAI";
  console.log(text);
  // Fetch citation from DB

  // Respond with text and citation

  res.status(200).json({
    gpt: text,
    similarChunks: await Promise.all(
      chunks.map(async (chunk) => {
        console.log(chunk);
        const {
          data: { in_text_citation, full_citation, title },
        } = await supabaseAdmin
          .from("papers")
          .select("in_text_citation, full_citation, title")
          .eq("doi", mostSimilarChunk?.doi)
          .single();

        return {
          test: "dasjflksdf",
          ...chunk,
          test2: "dasfsdf",
          title,
          in_text_citation,
          full_citation,
        };
      })
    ),
  });
}
