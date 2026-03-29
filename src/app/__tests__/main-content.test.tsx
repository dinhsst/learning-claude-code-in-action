import { test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import { MainContent } from "../main-content";

vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div>Chat</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">FileTree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">CodeEditor</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div>HeaderActions</div>,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResizablePanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResizableHandle: () => <div />,
}));

afterEach(cleanup);

// Radix UI Tabs fires onValueChange via onMouseDown, so we use fireEvent.mouseDown
function clickTab(tab: HTMLElement) {
  fireEvent.mouseDown(tab);
}

test("shows preview by default", () => {
  render(<MainContent />);
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("file-tree")).toBeNull();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("switches to code view when Code tab is clicked", () => {
  render(<MainContent />);

  const codeTab = screen.getByRole("tab", { name: "Code" });
  clickTab(codeTab);

  expect(screen.getByTestId("file-tree")).toBeDefined();
  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.queryByTestId("preview-frame")).toBeNull();
});

test("switches back to preview when Preview tab is clicked after Code", () => {
  render(<MainContent />);

  const codeTab = screen.getByRole("tab", { name: "Code" });
  clickTab(codeTab);

  expect(screen.queryByTestId("preview-frame")).toBeNull();

  const previewTab = screen.getByRole("tab", { name: "Preview" });
  clickTab(previewTab);

  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("file-tree")).toBeNull();
});

test("Preview tab has active data-state by default", () => {
  render(<MainContent />);

  const previewTab = screen.getByRole("tab", { name: "Preview" });
  const codeTab = screen.getByRole("tab", { name: "Code" });

  expect(previewTab.getAttribute("data-state")).toBe("active");
  expect(codeTab.getAttribute("data-state")).toBe("inactive");
});

test("Code tab has active data-state after clicking it", () => {
  render(<MainContent />);

  const codeTab = screen.getByRole("tab", { name: "Code" });
  clickTab(codeTab);

  expect(codeTab.getAttribute("data-state")).toBe("active");
  expect(screen.getByRole("tab", { name: "Preview" }).getAttribute("data-state")).toBe("inactive");
});
