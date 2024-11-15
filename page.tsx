'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heart } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

const FAQ_ITEMS = [
  // ... (keep the existing FAQ items)
]

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function Home() {
  const [input, setInput] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const prompts = [
    "How does the budget affect me?",
    "How does the budget affect my business?",
    "What are the main changes in the 2025 budget?",
    "How will the budget impact housing?",
    "What are the tax changes in the new budget?"
  ]

  const askGPT = async (question: string) => {
    setIsLoading(true)
    setChatHistory(prev => [...prev, { role: 'user', content: question }])
    
    try {
      const res = await fetch('/api/ask-gpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      
      if (data.error) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.error }])
      } else {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }])
      }
    } catch (error) {
      console.error('Error:', error)
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, there was an error processing your request. Please try again." }])
    }
    
    setIsLoading(false)
    setInput("")
  }

  const handlePromptClick = (prompt: string) => {
    setInput(prompt)
    askGPT(prompt)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      askGPT(input)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-green-600 text-white py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">Ask the Budget</h1>
          <p className="text-xl">Your AI assistant for the Irish Budget 2025</p>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Ask your question about the Irish Budget 2025</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
              {prompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto py-2 px-3 text-xs sm:text-sm text-center break-words hover:bg-green-100 transition-colors duration-200 cursor-pointer"
                  onClick={() => handlePromptClick(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>

            <div className="mb-4 h-64 overflow-y-auto border border-gray-200 rounded p-4">
              {chatHistory.map((message, index) => (
                <div key={index} className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {message.content}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question here..."
                className="flex-grow"
              />
              <Button 
                type="submit"
                disabled={isLoading}
                className="w-24"
              >
                {isLoading ? "Thinking..." : "Ask"}
              </Button>
            </form>
          </div>
        </Card>

        <section className="mt-12 bg-white shadow-lg rounded-lg overflow-hidden p-6">
          <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {FAQ_ITEMS.map((item, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                <h3 className="text-xl font-semibold mb-2">{item.question}</h3>
                <p className="text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          Made with <Heart className="inline-block text-green-400 mx-1" /> by the Coso.ai team - The AI-Powered Social Media Marketer for Irish SMBs
        </div>
      </footer>
    </div>
  )
}
