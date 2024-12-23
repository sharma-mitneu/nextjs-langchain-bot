import React, { useState } from "react";

const PromptSuggestionButton = ({ text, onClick }) => {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true); // Set loading state
        try {
            await onClick(); // Execute the passed onClick function
        } catch (error) {
            console.error("Error occurred in PromptSuggestionButton:", error);
        } finally {
            setLoading(false); // Reset loading state
        }
    };

    return (
        <button 
            className="promt-suggestion-button" 
            onClick={handleClick} 
            disabled={loading} // Disable button while loading
        >
            {loading ? "Loading..." : text} {/* Show loading text */}
        </button>
    );
};

export default PromptSuggestionButton;
