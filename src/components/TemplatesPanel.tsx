// Template gallery. Lists the 47 Khan Academy graphie templates ported from
// graphie-to-png/templates (auto-generated in src/templates.ts). Selecting a
// template loads its graphie code into the editor and re-renders the preview.

import { useCallback, useMemo, useState } from "react";
import styled from "@emotion/styled";
import { Search as SearchIcon, Code as CodeIcon } from "lucide-react";
import { templates } from "../templates";
import { useGraphieTheme } from "../theme";
import { useGraphieStore } from "../store";

interface TemplatesPanelProps {
  onLoadTemplate: (code: string, title: string) => void;
}

const Root = styled("div")`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--color-sidebar-bg);
  color: var(--color-on-surface);
`;

const Header = styled("div")`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  border-bottom: 1px solid var(--color-outline-variant);
  background: var(--color-surface-level-2);
  flex-shrink: 0;
`;

const Search = styled("div")`
  position: relative;
  flex: 1;
  min-width: 0;
`;

const SearchInput = styled("input")`
  width: 100%;
  height: 28px;
  padding-left: 32px;
  padding-right: 8px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline-variant);
  background: var(--color-surface-level-1);
  color: var(--color-on-surface);
  font-size: 12px;
  outline: none;
  box-sizing: border-box;

  &::placeholder {
    color: var(--color-outline);
    opacity: 0.7;
  }

  &:focus {
    border-color: var(--color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;

const SearchIconEl = styled(SearchIcon)`
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: var(--color-outline);
`;

const List = styled("div")`
  flex: 1;
  overflow: auto;
  padding: 8px 0;
`;

const Category = styled("div")<{ $collapsed?: boolean }>`
  padding: 8px 12px 4px;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-outline);
  cursor: pointer;
  user-select: none;

  &:hover {
    color: var(--color-on-surface);
  }
`;

const Item = styled("button")<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: ${(p) =>
    p.$active ? "var(--color-primary-container)" : "transparent"};
  color: ${(p) => (p.$active ? "var(--color-on-primary-container)" : "var(--color-on-surface)")};
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background-color 0.15s ease;

  &:hover {
    background: var(--color-surface-level-2);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    opacity: 0.6;
  }

  .title {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .id {
    margin-left: auto;
    font-size: 10px;
    opacity: 0.45;
  }
`;

export function TemplatesPanel({ onLoadTemplate }: TemplatesPanelProps) {
  const theme = useGraphieTheme();
  const setCode = useGraphieStore((s) => s.setCode);
  const setTitle = useGraphieStore((s) => s.setTitle);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return templates.filter(
      (t) =>
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q),
    );
  }, [query]);

  const byCategory = useMemo(() => {
    const map = new Map<string, typeof templates>();
    for (const t of filtered) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const loadTemplate = useCallback(
    (t: (typeof templates)[number]) => {
      setActiveId(t.id);
      setCode(t.code);
      setTitle(t.title);
      onLoadTemplate(t.code, t.title);
    },
    [setCode, setTitle, onLoadTemplate],
  );

  const toggleCategory = useCallback((cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  return (
    <Root>
      <Header>
        <Search>
          <SearchIconEl />
          <SearchInput
            placeholder="Search templates"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Search>
      </Header>
      <List>
        {byCategory.map(([category, items]) => {
          const collapsed = collapsedCategories.has(category);
          return (
            <div key={category}>
              <Category
                onClick={() => toggleCategory(category)}
                title={collapsed ? "Expand category" : "Collapse category"}
              >
                {category} ({items.length})
              </Category>
              {!collapsed && (
                <div style={{ paddingLeft: 8 }}>
                  {items.map((t) => (
                    <Item
                      key={t.id}
                      $active={activeId === t.id}
                      onClick={() => loadTemplate(t)}
                    >
                      <CodeIcon />
                      <span className="title">{t.title}</span>
                      <span className="id">{t.id}</span>
                    </Item>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {byCategory.length === 0 && (
          <div style={{ padding: 16, color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
            No templates match.
          </div>
        )}
      </List>
    </Root>
  );
}

export default TemplatesPanel;
