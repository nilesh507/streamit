'use client';

import { useEffect, useState } from 'react';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [isDarkMode]);

    return (
        <html lang="en" className="h-full">
            <head>
                <title>Monty Site</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body className="h-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300 flex flex-col">
                {/* Header */}
                <header className="bg-white dark:bg-gray-800 shadow-md py-4 sticky top-0 z-50">
                    <div className="container mx-auto px-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold tracking-wide">
                        🤙 Monty 
                        </h1>
                        <button
                            className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 transition-transform transform hover:scale-105"
                            onClick={() => setIsDarkMode(!isDarkMode)}
                        >
                            Toggle {isDarkMode ? 'Light' : 'Dark'} Mode
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto px-4 py-8 flex-grow">{children}</main>

                {/* Footer */}
                <footer className="bg-white dark:bg-gray-800 py-4 text-center shadow-md">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        © {new Date().getFullYear()} Monty 
                    </p>
                </footer>
            </body>
        </html>
    );
}
