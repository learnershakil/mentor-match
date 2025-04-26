'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';


export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
        }, 1500);
    };
    
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#F5EFF7]">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-[#2E1A47]">Reset your password</h2>
                    <p className="mt-2 text-sm text-[#A3779D]">
                        Enter your email and we'll send you instructions to reset your password
                    </p>
                </div>
                
                {!isSubmitted ? (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md -space-y-px">
                            <div className="relative">
                                <label htmlFor="email" className="sr-only">Email address</label>
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-[#A3779D]" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none rounded-lg relative block w-full pl-10 py-3 px-3 border border-gray-300 placeholder-gray-500 text-[#2E1A47] focus:outline-none focus:ring-[#663399] focus:border-[#663399] focus:z-10"
                                    placeholder="Email address"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#663399] hover:bg-[#5a2d8a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#663399] transition-colors duration-200"
                            >
                                {isLoading ? 'Sending...' : 'Send reset instructions'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="bg-[#F5EFF7] p-6 rounded-lg text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#663399]/20 mb-4">
                            <Mail className="h-8 w-8 text-[#663399]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#2E1A47]">Check your inbox</h3>
                        <p className="mt-2 text-sm text-[#A3779D]">
                            We've sent password reset instructions to:<br />
                            <span className="font-medium text-[#2E1A47]">{email}</span>
                        </p>
                    </div>
                )}
                
                <div className="mt-4 text-center">
                    <Link 
                        href="/signin" 
                        className="inline-flex items-center font-medium text-sm text-[#663399] hover:text-[#A3779D] transition-colors duration-200"
                    >
                        <ArrowLeft className="mr-2" /> Back to login
                    </Link>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                    <p className="text-xs text-center text-[#A3779D]">
                        Didn't receive the email? Check your spam folder or{' '}
                        <button 
                            type="button"
                            onClick={() => setIsSubmitted(false)}
                            className="text-[#663399] hover:text-[#5a2d8a] font-medium"
                        >
                            try another email
                        </button>
                    </p>
                </div>
            </div>
            
            <div className="mt-6">
                <p className="text-center text-xs text-[#A3779D]">
                    Need help? <a href="#" className="font-medium text-[#663399] hover:text-[#5a2d8a]">Contact support</a>
                </p>
            </div>
        </div>
    );
}