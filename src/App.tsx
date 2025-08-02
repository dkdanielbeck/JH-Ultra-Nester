import "./App.css";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { RectangleHorizontal, Square, SquareSplitHorizontal, TableCellsMerge, Ticket, TicketMinus, Zap } from "lucide-react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import MySheets from "@/pages/MySheets";
import MySheetElements from "@/pages/MySheetElements";
import { Button } from "./components/ui/button";
import MySheetMachines from "./pages/MySheetMachines";
import { Link } from "react-router-dom";
import MySteelLengths from "./pages/MySteelLengths";
import MySteelLengthElements from "./pages/MySteelLengthElements";
import CalculateSheetNesting from "@/pages/CalculateSheetNesting";
import CalculateLengthNesting from "./pages/CalculateLengthNesting";
import PrivateRoute from "./components/my-components/PrivateRoute";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import SignIn from "./pages/SignIn";

const STORAGE_KEY = "language";

export function loadLanguage(): string {
  try {
    const languageString = localStorage.getItem(STORAGE_KEY);

    return languageString ?? "en";
  } catch (e) {
    console.error("Failed to load language:", e);
    return "en";
  }
}

function saveLanguage(languageString: string) {
  try {
    localStorage.setItem(STORAGE_KEY, languageString);
  } catch (e) {
    console.error("Failed to save language:", e);
  }
}

function App() {
  const [language, setLanguage] = useState<string>(() => loadLanguage());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showGuideVideo, setShowGuideVideo] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Optional: auto-update on login/logout
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const menuItems = [
    {
      title: language === "da" ? "Plade nesting" : "Sheet nesting",
      children: [
        {
          title: language === "da" ? "Udregn plade nesting" : "Calculate sheet nesting",
          icon: TableCellsMerge,
          path: "/calculate-sheet-nesting",
          divider: false,
        },
        {
          title: language === "da" ? "Mine plader" : "My sheets",
          icon: Square,
          path: "/sheets",
          divider: false,
        },
        {
          title: language === "da" ? "Mine plade emner" : "My sheet elements",
          icon: RectangleHorizontal,
          path: "/sheet-elements",
          divider: false,
        },
        {
          title: language === "da" ? "Mine plade maskiner" : "My sheet machines",
          icon: Zap,
          path: "/sheet-machines",
          divider: true,
        },
      ],
    },
    {
      title: language === "da" ? "Stål længde nesting" : "Steel length nesting",
      children: [
        {
          title: language === "da" ? "Udregn stål længde nesting" : "Calculate steel length nesting",
          icon: SquareSplitHorizontal,
          path: "/calculate-length-nesting",
          divider: false,
        },
        {
          title: language === "da" ? "Mine stål længder" : "My steel lengths",
          icon: TicketMinus,
          path: "/steel-lengths",
          divider: false,
        },
        {
          title: language === "da" ? "Mine stål længde emner" : "My steel length elements",
          icon: Ticket,
          path: "/steel-length-elements",
          divider: true,
        },
      ],
    },
  ];

  useEffect(() => {
    saveLanguage(language);
  }, [language]);

  return (
    <Router>
      <SidebarProvider>
        {isAuthenticated && (
          <Sidebar>
            <SidebarHeader>Ultra Nester</SidebarHeader>
            <SidebarContent className="gap-0">
              {menuItems.map((item) => (
                <SidebarGroup key={item.title}>
                  <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {item.children.map((child) => {
                        return (
                          <SidebarMenuItem style={child.divider ? { borderBottom: "1px solid var(--border)", paddingBottom: "10px" } : {}} key={child.title}>
                            <SidebarMenuButton asChild>
                              <Link to={child.path} className="flex items-center gap-2">
                                <child.icon className="h-4 w-4" />
                                <span>{child.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>
        )}
        <SidebarInset>
          <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
            {isAuthenticated && <SidebarTrigger className="-ml-1" />}
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">{language === "da" ? "Sprog" : "Language"}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel> {language === "da" ? "Sprog" : "Language"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={language === "en"}
                  onCheckedChange={() => {
                    setLanguage("en");
                    window.location.reload();
                  }}
                >
                  {language === "da" ? "Engelsk" : "English"}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={language === "da"}
                  onCheckedChange={() => {
                    setLanguage("da");
                    window.location.reload();
                  }}
                >
                  {language === "da" ? "Dansk" : "Danish"}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {isAuthenticated && (
              <Button onClick={() => setShowGuideVideo(true)} variant="outline">
                {language === "da" ? "Se guide video" : "Watch guide video"}
              </Button>
            )}
            {isAuthenticated && (
              <Button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/JH-Ultra-Nester/#/sign-in";
                }}
                className="ml-auto"
                variant="ghost"
              >
                {language === "da" ? "Log ud" : "Sign out"}
              </Button>
            )}
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Routes>
              <Route path="/" element={<RedirectToStart />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <Routes>
                      <Route path="/calculate-sheet-nesting" element={<CalculateSheetNesting />} />
                      <Route path="/calculate-length-nesting" element={<CalculateLengthNesting />} />
                      <Route path="/sheets" element={<MySheets />} />
                      <Route path="/sheet-elements" element={<MySheetElements />} />
                      <Route path="/sheet-machines" element={<MySheetMachines />} />
                      <Route path="/steel-lengths" element={<MySteelLengths />} />
                      <Route path="/steel-length-elements" element={<MySteelLengthElements />} />
                    </Routes>
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
          {showGuideVideo && (
            <div className="fixed bottom-4 left-4  w-[90%] max-w-[1200px] bg-background border rounded-xl shadow-lg z-50 flex flex-col" style={{ zIndex: 50 }}>
              <div className="flex justify-between items-center p-2 border-b">
                <span className="text-sm font-medium">{language === "da" ? "Guide video" : "Guide Video"}</span>
                <Button onClick={() => setShowGuideVideo(false)} className="text-sm hover:opacity-75" aria-label="Close">
                  ✕
                </Button>
              </div>
              <video controls className="w-full h-full rounded-b-xl" preload="metadata" src="./guide.mp4" />
            </div>
          )}
        </SidebarInset>
      </SidebarProvider>
    </Router>
  );
}

export default App;

function RedirectToStart() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  return isAuthenticated ? <Navigate to="/calculate-sheet-nesting" replace /> : <Navigate to="/sign-in" replace />;
}
