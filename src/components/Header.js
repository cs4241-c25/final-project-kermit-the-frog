'use client';
import Link from 'next/link';
import { useTheme } from '@/lib/ThemeContext';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Header({ variant = 'home' }) {
  const { theme, setTheme, themes } = useTheme();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navConfig = {
    login: {
      link: "/auth/register",
      text: "Register"
    },
    register: {
      link: "/auth/login",
      text: "Log In"
    },
    timer: {
      links: [
        { href: "/dashboard/data", text: "Show Data" },
        { action: handleSignOut, text: "Sign Out" }
      ]
    },
    data: {
      links: [
        { href: "/dashboard/timer", text: "Back to Timer" },
        { action: handleSignOut, text: "Sign Out" }
      ]
    },
    home: {
      link: "/auth/login",
      text: "Log In"
    }
  };

  // Separate animation classes for clarity
  const underlineAnimation = [
    "relative",                    // Position relative for absolute positioning of underline
    "after:absolute",             // Position the underline absolutely
    "after:bottom-[-10px]",        // Move underline 4px below text
    "after:left-0",               // Start from left
    "after:h-[3px]",              // Make underline 3px thick
    "after:w-full",               // Full width
    "after:origin-bottom-right",  // Transform origin for animation
    "after:scale-x-0",           // Initially scaled to 0
    "after:bg-text",             // Use text color for underline
    "after:transition-transform", // Enable transform transitions
    "after:duration-300",        // Animation duration
    "hover:after:origin-bottom-left", // Change origin on hover
    "hover:after:scale-x-100",    // Scale to full width on hover
    "active:text-secondary/80",
    "active:after:bg-secondary/80"
  ].join(" ");

  const renderNavLinks = () => {
    const config = navConfig[variant];
    
    if (config.links) {
      return (
        <div className="flex items-center">
          {config.links.map((item, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-4 text-text/30 font-light">|</span>
              )}
              {item.href ? (
                <Link href={item.href} className={underlineAnimation}>
                  {item.text}
                </Link>
              ) : (
                <button 
                  onClick={item.action}
                  className={underlineAnimation}
                >
                  {item.text}
                </button>
              )}
            </div>
          ))}
        </div>
      );
    }

    return (
      <Link href={config.link} className={underlineAnimation}>
        {config.text}
      </Link>
    );
  };

  return (
    <nav className="bg-primary/60 min-h-20 shadow-xl p-2 lg:py-4 lg:px-8 w-full flex justify-between items-center text-text text-2xl font-semibold lg:text-2xl">
        <Link href="/" className="flex items-center gap-4 font-bold text-text">
            <img src="/kermit.png" alt="Kermit" width={60} height={60} className="hidden sm:block wrap-content w-19 h-19" />
            <p className="hidden lg:block">Kermit-The-Timer</p>
        </Link>

        <div className="text-center absolute sm:left-1/2 transform sm:-translate-x-1/2">
            {renderNavLinks()}
        </div>

        <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="hidden md:block dropdown"
        >
            {Object.entries(themes).map(([value, label]) => (
            <option key={value} value={value}>
                {label} Theme
            </option>
            ))}
        </select>
    </nav>
  );
}
