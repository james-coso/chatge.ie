// route.ts
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.ASSISTANT_ID;

export async function POST(req: Request) {
  try {
    const { messages, threadId } = await req.json();
    console.log("Received messages:", messages);
    console.log("Thread ID:", threadId);

    let currentThread;

    if (threadId) {
      // Retrieve existing thread
      try {
        const existingMessages = await openai.beta.threads.messages.list(threadId);
        currentThread = { id: threadId };
        console.log("Retrieved existing thread:", threadId);
      } catch (error) {
        console.log("Error retrieving thread, creating new one:", error);
        currentThread = await openai.beta.threads.create();
      }
    } else {
      // Create new thread
      currentThread = await openai.beta.threads.create();
      console.log("Created new thread:", currentThread.id);
    }

    // Get the last message from the client
    const lastMessage = messages[messages.length - 1];
    
    // Add the new message to the thread
    await openai.beta.threads.messages.create(currentThread.id, {
      role: lastMessage.role,
      content: lastMessage.content,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(currentThread.id, {
      assistant_id: ASSISTANT_ID,
      instructions: "You are an AI assistant helping users with questions about Irish General Elections. Reference previous messages in the thread to maintain context."
    });

    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(currentThread.id, run.id);
    let attempts = 0;
    const maxAttempts = 30; // Maximum 30 seconds wait
    
    while (runStatus.status !== "completed" && attempts < maxAttempts) {
      if (runStatus.status === "failed" || runStatus.status === "cancelled") {
        throw new Error(`Run failed: ${runStatus.last_error?.message || 'Unknown error'}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(currentThread.id, run.id);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Request timed out');
    }

    // Get the latest messages
    const threadMessages = await openai.beta.threads.messages.list(currentThread.id);
    console.log("All thread messages:", threadMessages);

    const lastAssistantMessage = threadMessages.data
      .filter((message) => message.role === "assistant")
      .shift(); // Get the most recent assistant message

    if (!lastAssistantMessage || !lastAssistantMessage.content) {
      throw new Error('No valid response from assistant');
    }

    const assistantText = extractText(lastAssistantMessage);
    const formattedResponse = formatResponse(assistantText);

    // Log the full conversation state
    console.log("Current thread state:", {
      threadId: currentThread.id,
      messageCount: threadMessages.data.length,
      latestResponse: formattedResponse
    });

    return NextResponse.json({ 
      response: formattedResponse,
      threadId: currentThread.id
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' }, 
      { status: 500 }
    );
  }
}

function extractText(message: any): string {
  if (Array.isArray(message.content)) {
    return message.content[0]?.text?.value || '';
  }
  if (typeof message.content === 'string') {
    return message.content;
  }
  if (message.content?.text?.value) {
    return message.content.text.value;
  }
  return '';
}

function formatResponse(text: string): string {
  if (typeof text !== 'string') {
    return "<p>Invalid response format</p>";
  }

  // Remove [source] references
  let cleanText = text.replace(/【\d+:\d+†source】/g, '');

  // Convert markdown-like formatting to HTML
  cleanText = cleanText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Ensure the text is wrapped in paragraphs
  if (!cleanText.startsWith('<p>')) {
    cleanText = '<p>' + cleanText;
  }
  if (!cleanText.endsWith('</p>')) {
    cleanText = cleanText + '</p>';
  }

  return cleanText;
}
