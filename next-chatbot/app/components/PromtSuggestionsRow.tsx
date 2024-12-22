import { text } from "stream/consumers"
import PromptSuggestionButton from "./PromptSuggestionButton"

const PromptSuggestionRow = ({ onPromptClick }) => {

    const prompts = [
        "Who is the best player in premier league history ?",
        "Who is the highest goal scorer ?",
        "Who is the current leader in premier league ?",
        "Who is the amad diallo ?"
    ]
    return (

        <div className="prompt-suggestion-row">
            {prompts.map((prompt, index) => (
            <PromptSuggestionButton 
            key={prompt || `suggestion-${index}`} 
            text={prompt} 
             onClick={() => onPromptClick(prompt)} 
    />
  ))}
</div>

        
    )

}

export default PromptSuggestionRow