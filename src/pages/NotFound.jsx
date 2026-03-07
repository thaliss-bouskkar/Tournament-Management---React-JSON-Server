import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[75vh] px-6 text-center animate-in fade-in duration-700">
            <div className="relative mb-12">
                <div className="absolute inset-0 bg-red-500/20 blur-[80px] rounded-full scale-150 animate-pulse"></div>
                <div className="relative w-32 h-32 md:w-48 md:h-48 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-gray-50 transform hover:rotate-6 transition-transform duration-500">
                    <ShieldAlert size={80} className="text-red-500 md:size-120" />
                </div>
                <div className="absolute -bottom-4 -right-4 w-12 h-12 md:w-16 md:h-16 bg-accent rounded-2xl shadow-xl flex items-center justify-center text-primary font-black text-xl md:text-2xl border-4 border-white">
                    !
                </div>
            </div>

            <div className="space-y-6 max-w-lg">
                <div className="space-y-2">
                    <h1 className="text-8xl md:text-9xl font-black text-primary tracking-tighter opacity-10">404</h1>
                    <h2 className="text-4xl md:text-5xl font-black text-primary -mt-12 md:-mt-16 tracking-tight">
                        Page Not Found
                    </h2>
                </div>

                <p className="text-gray-400 text-lg font-medium leading-relaxed">
                    The content you're looking for has moved to another stadium or doesn't exist yet.
                </p>

                <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/"
                        className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 group"
                    >
                        <Home size={20} className="text-accent group-hover:scale-110 transition-transform" />
                        Go Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto px-8 py-4 bg-white border border-gray-100 hover:border-accent text-primary rounded-2xl font-black uppercase tracking-widest shadow-sm hover:shadow-xl transition-all flex items-center justify-center gap-3 group"
                    >
                        <ArrowLeft size={20} className="text-accent group-hover:-translate-x-1 transition-transform" />
                        Go Back
                    </button>
                </div>
            </div>

            <div className="mt-20 opacity-20 hidden md:block">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">
                    Broken Link Detected • Admin Contacted
                </p>
            </div>
        </div>
    );
};

export default NotFound;
