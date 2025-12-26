interface MenuItem {
  id: string;
  label: string;
}

interface SettingsSidebarProps {
  items: MenuItem[];
  activeItem: string;
  onItemChange: (id: string) => void;
}

export function SettingsSidebar({
  items,
  activeItem,
  onItemChange,
}: SettingsSidebarProps): React.ReactElement {
  return (
    <aside className="ht-settings-sidebar">
      <div className="ht-settings-sidebar-header">
        <h2 className="ht-settings-sidebar-title">Settings</h2>
      </div>
      <nav className="ht-settings-menu">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            className={`ht-settings-menu-item ${activeItem === item.id ? 'ht-settings-menu-item-active' : ''}`}
            onClick={() => onItemChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
