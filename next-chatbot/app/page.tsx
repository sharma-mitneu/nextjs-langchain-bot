"use client";

import Image from "next/image";
import premierLeagueLogo from "./assests/premierLeagueLogo.jpeg";
import { useChat } from "ai/react";
import { Message } from "ai";
import clsx from "clsx";
import Bubble from "./components/bubble";
import LoadingBubble from "./components/LoadingBubble";
import PromtSuggestionsRow from "./components/PromtSuggestionsRow";
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
            console.log("New Data in UI " + data.choices)
            setApiResponse(data.choices); // Assuming "choices" contains the response text
        } catch (err) {
            console.error(err.message);
            setApiResponse("Failed to fetch response. Please try again.");
        }
    };

    const handlePrompt = async (promptText: string) => {
        const msg: Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user",
        };
        append(msg);

        // Fetch API response after user input
        await fetchApiResponse(promptText);
    };

    return (
        <main>
            <Image src={premierLeagueLogo} width="250" alt="Premier League GPT" />

            <section className={clsx({ populated: !noMessages })}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            Welcome to PremierLeagueGPT! Ask me anything about the Premier League and it will come back
                            with the most up-to-date answers! Hope you enjoy it!
                        </p>
                        <br />
                        <PromtSuggestionsRow onPromptClick={handlePrompt} />
                    </>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <Bubble key={`message-${index}`} message={message} />
                        ))}
                        {isLoading && <LoadingBubble />}
                    </>
                )}
            </section>

            {apiResponse && (
                <section className="api-response">
                    <h2>Response:</h2>
                    <p>{apiResponse}</p>
                </section>
            )}

            <form onSubmit={handleSubmit}>
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
                <input type="submit" />
            </form>
        </main>
    );
};

export default Home;
