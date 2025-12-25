interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
}: TabsProps): React.ReactElement {
  return (
    <div className="ht-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`ht-tab ${activeTab === tab.id ? 'ht-tab-active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
