import "./App.css";
import { MaxRectsPacker, Rectangle } from "maxrects-packer";
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
import { RectangleHorizontal, Square, TableCellsMerge, Zap } from "lucide-react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import MySheets from "@/pages/MySheets";
import MyElements from "@/pages/MyElements";
import CalculateNesting from "@/pages/CalculateNesting";
import { Button } from "./components/ui/button";
import { useEffect, useState } from "react";
import MyMachines from "./pages/MyMachines";
type Sheet = {
  width: number;
  height: number;
  id: string;
};

type Shape = {
  width: number;
  height: number;
  id: string;
};

const STORAGE_KEY = "language";

type Shapes = Shape[];
type Sheets = Sheet[];

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
      title: language === "da" ? "Udregn nesting" : "Calculate nesting",
      icon: TableCellsMerge,
      path: "/",
    },
    {
      title: language === "da" ? "Mine plader" : "My sheets",
      icon: Square,
      path: "/sheets",
    },
    {
      title: language === "da" ? "Mine emner" : "My elements",
      icon: RectangleHorizontal,
      path: "/elements",
    },
    {
      title: language === "da" ? "Mine maskiner" : "My machines",
      icon: Zap,
      path: "/machines",
    },
  ];
  const spacing: number = 10;

  useEffect(() => {
    saveLanguage(language);
  }, [language]);

  const sheets: Sheets = [
    { width: 3000, height: 1500, id: "1" },
    { width: 2000, height: 1000, id: "2" },
    { width: 2500, height: 1250, id: "3" },
    { width: 1500, height: 750, id: "4" },
  ];

  const shapes: Shapes = [
    { width: 500, height: 400, id: "1" },
    { width: 800, height: 600, id: "2" },
    { width: 300, height: 700, id: "3" },
    { width: 1000, height: 1000, id: "4" },
  ];

  const results = sheets.map((sheet) => {
    const packer = new MaxRectsPacker(sheet.width, sheet.height, spacing, {
      smart: true,
      pot: false,
      square: false,
      allowRotation: true,
      tag: false,
    });

    // Deep copy the shapes so each packer gets a fresh input
    packer.addArray(
      shapes.map(
        (shape) =>
          ({
            width: shape.width,
            height: shape.height,
            id: shape.id,
          } as unknown as Rectangle)
      )
    );

    return {
      sheet: `${sheet.width}×${sheet.height}`,
      binCount: packer.bins.length,
      bins: packer.bins,
    };
  });

  // Sort by most efficient (fewest sheets used)
  results.sort((a, b) => a.binCount - b.binCount);

  return (
    <Router>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>Ultra Nester</SidebarHeader>
          <SidebarContent className="gap-0">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a href={item.path} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
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
              <Route path="/" element={<Navigate to="/calculate" replace />} />
              <Route path="/calculate" element={<CalculateNesting />} />
              <Route path="/sheets" element={<MySheets />} />
              <Route path="/elements" element={<MyElements />} />
              <Route path="/machines" element={<MyMachines />} />
            </Routes>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </Router>
  );
}

export default App;
