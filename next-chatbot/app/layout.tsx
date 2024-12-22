import "./global.css"

export const metadata = {
    title: "PremierLeagueGPT",
    description: "The plafe to go for all your Premier League questions !"
}

const RootLayout = ({ children }) => {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    )
}

export default RootLayout;