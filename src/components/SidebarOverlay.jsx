import React from 'react';

const SidebarOverlay = ({ show, onClick }) => {
    if (!show) return null;

    return (
        <div
            className="sidebar-overlay show"
            onClick={onClick}
        />
    );
};

export default SidebarOverlay;