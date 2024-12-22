"use client";

import Image from "next/image";
import premierLeagueLogo from "./assests/premierLeagueLogo.jpeg"
import { useChat } from "ai/react";
import { Message } from "ai";
import clsx from "clsx";
import Bubble from "./components/bubble";
import LoadingBubble from "./components/LoadingBubble";
import PromtSuggestionsRow from "./components/PromtSuggestionsRow";

const Home = () => {
    const { append, isLoading, messages, input, handleInputChange, handleSubmit } = useChat();
    const noMessages = !messages || messages.length === 0;

    const handlePrompt = (promptText: string) => {
        const msg: Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user",
        };
        append(msg);
    };

    return (
        <main>
            <Image src={premierLeagueLogo} width="250" alt="Premier League GPT" />

            <section className={clsx({ populated: !noMessages })}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            Welcome to PremierLeagueGPT! Ask me anything about the Premier League.
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
