import React, { useState } from "react";
import PropTypes from "prop-types";

const PromptSuggestionButton = ({ text, onClick }) => {
    const [loading, setLoading] = useState(false);

    const handleClick = async (event) => {
        event.stopPropagation(); // Prevent parent event handling
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
            disabled={loading} 
            aria-busy={loading}
            aria-label={loading ? "Loading..." : text}
        >
            {loading ? "Loading..." : text}
        </button>
    );
};

PromptSuggestionButton.propTypes = {
    text: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
};

PromptSuggestionButton.defaultProps = {
    text: "Submit",
};

export default PromptSuggestionButton;
