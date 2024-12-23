import React from "react";
import PromptSuggestionButton from "./PromptSuggestionButton";

interface PromptSuggestionRowProps {
    onPromptClick: (prompt: string) => void;
}

const PromptSuggestionRow: React.FC<PromptSuggestionRowProps> = ({ onPromptClick }) => {
    const prompts = [
        "Who is the best player in Premier League history?",
        "Who is the highest goal scorer?",
        "Who is the current leader in the Premier League?",
        "Who is Amad Diallo?",
    ];

    return (
        <div className="prompt-suggestion-row">
            {prompts.length === 0 ? (
                <p>No suggestions available.</p>
            ) : (
                prompts.map((prompt, index) => (
                    <PromptSuggestionButton
                        key={`suggestion-${index}`}
                        text={prompt}
                        onClick={() => onPromptClick(prompt)}
                    />
                ))
            )}
        </div>
    );
};

export default PromptSuggestionRow;
