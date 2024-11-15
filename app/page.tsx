"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Heart, Send } from 'lucide-react';
import Head from "next/head";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface FAQItem {
  question: string;
  answer: string;
}


export default function ChatGE() {
  const [input, setInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  const generalPrompts = [
    "How does the General Election affect me?",
    "When is the next General Election?",
    "How do I register to vote?",
    "What are the key election issues?",
  ];

  const partyPrompts = [
    { name: "Fianna Fáil", prompt: "What are Fianna Fáil's (FF) main policies?" },
    { name: "Fine Gael", prompt: "What are Fine Gael's (FG) main policies?" },
    { name: "Sinn Féin", prompt: "What are Sinn Féin's (SF) main policies?" },
    { name: "Green Party", prompt: "What are the Green Party's (GP) main policies?" },
  ];

  const faqItems: FAQItem[] = [
    {
      question: "When is the next General Election in Ireland?",
      answer: "The next Irish General Election must be held no later than February 2025, but the exact date is yet to be announced."
    },
    {
      question: "How does the Irish voting system work?",
      answer: "Ireland uses a proportional representation system with a single transferable vote (PR-STV) for general elections. Voters rank candidates in order of preference on their ballot papers."
    },
    {
      question: "Who can vote in Irish General Elections?",
      answer: "Irish citizens aged 18 or over who are ordinarily resident in Ireland and registered to vote are eligible to participate in General Elections."
    },
    {
      question: "How do I register to vote?",
      answer: "You can register to vote by completing a voter registration form and returning it to your local authority. Forms are available from local authorities, post offices, and online at checktheregister.ie."
    }
  ];

  function formatResponse(text: string): string {
    if (typeof text !== 'string') {
      return "<p>Invalid response format</p>";
    }

    let cleanText = text.replace(/【\d+:\d+†source】/g, '');
    cleanText = cleanText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/_(.*?)_/g, '<em>$1</em>')              // Italic
      .replace(/`([^`]+)`/g, '<code>$1</code>');       // Inline code

    const paragraphs = cleanText.split('\n\n');
    return paragraphs
      .map(paragraph => `<p>${paragraph.trim().replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  const askGPT = async (question: string) => {
    setIsLoading(true);
  
    const updatedChatHistory: Message[] = [...chatHistory, { role: 'user', content: question }];
    setChatHistory(updatedChatHistory);
  
    try {
      const res = await fetch('/api/ask-gpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedChatHistory,
          threadId: threadId ?? undefined,
        }),
      });
  
      const data: { response?: string; threadId?: string; error?: any } = await res.json();
      if (res.ok && data.response) {
        setChatHistory((prev) => [
          ...prev,
          { role: 'assistant', content: formatResponse(data.response ?? "No response available") },
        ] as Message[]);        
        
        if (data.threadId) {
          setThreadId(data.threadId);
        }
      } else {
        console.error("Server Error:", data.error || "No response provided.");
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setIsLoading(false);
    setInput("");
  };
  

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    askGPT(prompt);
  };

  return (
    <>
      <Head>
        <title>chatGE.ie - Your AI Assistant for Irish General Elections</title>
        <meta name="description" content="Get answers about Irish General Elections and political party policies. Ask questions and get instant responses from our AI assistant." />
      </Head>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-green-600 text-white py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-2">chatGE.ie</h1>
            <p className="text-xl">Your AI assistant for Irish General Elections</p>
          </div>
        </header>

        <main className="flex-grow container mx-auto px-4 py-12">
          <Card className="bg-white shadow-lg rounded-lg overflow-hidden mb-12">
            <div className="p-6 md:p-8">
              <h2 className="text-3xl font-semibold mb-6 text-center">Ask about the Irish General Election</h2>

              <Tabs defaultValue="general" className="mb-8">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general">General Questions</TabsTrigger>
                  <TabsTrigger value="parties">Political Parties</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {generalPrompts.map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto py-2 px-3 text-sm text-center break-words hover:bg-green-50 transition-colors duration-200"
                        onClick={() => handlePromptClick(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="parties" className="mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {partyPrompts.map((party, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto py-2 px-3 text-sm text-center break-words hover:bg-green-50 transition-colors duration-200"
                        onClick={() => handlePromptClick(party.prompt)}
                      >
                        {party.name}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mb-4 h-64 overflow-y-auto border border-gray-200 rounded p-4">
                {chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    <span
                      className={`inline-block p-2 rounded-lg ${
                        message.role === 'user' ? 'bg-green-100' : 'bg-gray-100'
                      }`}
                      dangerouslySetInnerHTML={{ __html: message.content }}
                    />
                  </div>
                ))}
                {isLoading && <p>Thinking...</p>}
              </div>

              <div className="flex flex-col space-y-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question here..."
                  className="flex-grow resize-none"
                  rows={3}
                />
                <Button
                  onClick={() => askGPT(input)}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white self-end"
                >
                  {isLoading ? "Thinking..." : <Send className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </Card>

          {/* FAQ Section */}
          <section className="bg-white shadow-lg rounded-lg overflow-hidden p-6 md:p-8">
            <h2 className="text-3xl font-semibold mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </main>

        <footer className="bg-gray-800 text-white py-6">
          <div className="container mx-auto px-4 text-center">
            <p className="mb-2">Made with <Heart className="inline-block text-red-400 mx-1" /> by the chatGE.ie team</p>
            <p className="text-sm text-gray-400">Your AI-Powered Assistant for Irish General Elections</p>
          </div>
        </footer>
      </div>
    </>
  );
}
