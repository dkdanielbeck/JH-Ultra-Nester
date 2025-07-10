import "./App.css";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
import { useEffect, useState } from "react";
import MySheetMachines from "./pages/MySheetMachines";
import { Link } from "react-router-dom";
import MySteelLengths from "./pages/MySteelLengths";
import MySteelLengthElements from "./pages/MySteelLengthElements";
import CalculateSheetNesting from "@/pages/CalculateSheetNesting";
import CalculateLengthNesting from "./pages/CalculateLengthNesting";

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

  const menuItems = [
    {
      title: language === "da" ? "Udregn plade nesting" : "Calculate sheet nesting",
      icon: TableCellsMerge,
      path: "/calculate-sheet-nesting",
      divider: false,
    },
    {
      title: language === "da" ? "Udregn stål længde nesting" : "Calculate steel length nesting",
      icon: SquareSplitHorizontal,
      path: "/calculate-length-nesting",
      divider: true,
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
  ];

  useEffect(() => {
    saveLanguage(language);
  }, [language]);

  return (
    <Router>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>Ultra Nester</SidebarHeader>
          <SidebarContent className="gap-0">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    return (
                      <SidebarMenuItem style={item.divider ? { borderBottom: "1px solid var(--border)" } : {}} key={item.title}>
                        <SidebarMenuButton asChild>
                          <Link to={item.path} className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
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
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Routes>
              <Route path="/" element={<Navigate to="/calculate-sheet-nesting" replace />} />
              <Route path="/calculate-sheet-nesting" element={<CalculateSheetNesting />} />
              <Route path="/calculate-length-nesting" element={<CalculateLengthNesting />} />
              <Route path="/sheets" element={<MySheets />} />
              <Route path="/sheet-elements" element={<MySheetElements />} />
              <Route path="/sheet-machines" element={<MySheetMachines />} />
              <Route path="/steel-lengths" element={<MySteelLengths />} />
              <Route path="/steel-length-elements" element={<MySteelLengthElements />} />
            </Routes>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </Router>
  );
}

export default App;
