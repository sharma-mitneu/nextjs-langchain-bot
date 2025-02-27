"use client";

import Image from "next/image";
import premierLeagueLogo from "./assests/premierLeagueLogo.jpeg";
import { useChat } from "ai/react";
import { Message } from "ai";
import clsx from "clsx";
import Bubble from "./components/bubble";
import LoadingBubble from "./components/LoadingBubble";
import PromptSuggestionsRow from "./components/PromtSuggestionsRow";
import { useState } from "react";

const Home = () => {
    const { append, isLoading, messages, input, handleInputChange, handleSubmit } = useChat();
    const [apiResponse, setApiResponse] = useState<string | null>(null);
    const noMessages = !messages || messages.length === 0;

    const fetchApiResponse = async (promptText: string) => {
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [{ role: "user", content: promptText }],
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch API response.");
            }

            const data = await response.json();
            console.log("New Data in UI:", data.choices);

            const botMessage: Message = {
                id: crypto.randomUUID(),
                content: data.choices || "No response received.",
                role: "assistant",
            };
            append(botMessage);
        } catch (err) {
            console.error(err.message);
            setApiResponse("Failed to fetch response. Please try again.");
        }
    };

    const handlePrompt = async (promptText: string) => {
        const userMessage: Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user",
        };
        append(userMessage);
        handleInputChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
        await fetchApiResponse(promptText);
    };

    return (
        <main className="chat-container">
            {/* Premier League Logo */}
            <Image src={premierLeagueLogo} width="250" alt="Premier League GPT" />

            {/* Message Section */}
            <section className={clsx("chat-history", { populated: !noMessages })}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            Welcome to PremierLeagueGPT! Ask me anything about the Premier League, and it will come back
                            with the most up-to-date answers! Hope you enjoy it!
                        </p>
                        <PromptSuggestionsRow onPromptClick={handlePrompt} />
                    </>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <div
                                key={`message-${index}`}
                                className={clsx("message", {
                                    "user-message": message.role === "user",
                                    "assistant-message": message.role === "assistant",
                                })}
                            >
                                {/* Icon for User or Assistant */}
                                <div
                                    className={clsx({
                                        "user-icon": message.role === "user",
                                        "assistant-icon": message.role === "assistant",
                                    })}
                                >
                                    {message.role === "user" ? "U" : "A"}
                                </div>
                                <Bubble message={message} />
                            </div>
                        ))}
                        {isLoading && <LoadingBubble />}
                    </>
                )}

                {/* Display API Error if present */}
                {apiResponse && (
                    <section className="api-response">
                        <h2>Response:</h2>
                        <p>{apiResponse}</p>
                    </section>
                )}
            </section>

            {/* User Input Form */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (input.trim()) {
                        handlePrompt(input);
                    }
                }}
                className="user-input-form"
            >
                <label htmlFor="question-box" className="sr-only">
                    Ask a question
                </label>
                <input
                    id="question-box"
                    className="question-box"
                    onChange={handleInputChange}
                    value={input}
                    placeholder="Ask me something..."
                />
                <button type="submit" className="submit-button" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send"}
                </button>
            </form>
        </main>
    );
};

export default Home;
