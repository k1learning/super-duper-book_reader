import React from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';

const ArchiveFilters = ({ filters, onFilterChange, availableGenres }) => {

    const handleCheckboxChange = (category, value) => {
        const currentValues = filters[category] || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        onFilterChange(category, newValues);
    };

    const handleSortChange = (e) => {
        onFilterChange('sort', e.target.value);
    };

    return (
        <div style={{ width: '250px', padding: '20px', borderRight: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px', color: 'var(--color-text)' }}>
                <Filter size={20} />
                <h2 style={{ margin: 0, fontSize: '18px' }}>Filters</h2>
            </div>

            {/* Sort */}
            <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Sort By</label>
                <select
                    value={filters.sort || 'newest'}
                    onChange={handleSortChange}
                    style={{
                        width: '100%', padding: '8px', borderRadius: '6px',
                        border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card-bg)', color: 'var(--color-text)'
                    }}
                >
                    <option value="newest">Newest Added</option>
                    <option value="oldest">Oldest Added</option>
                    <option value="latest_read">Recently Read</option>
                    <option value="rating_desc">Highest Rated</option>
                    <option value="notes_desc">Most Notes</option>
                </select>
            </div>

            {/* Format */}
            <FilterSection title="Format">
                <Checkbox label="Digital (PDF)" checked={filters.format?.includes('Digital')} onChange={() => handleCheckboxChange('format', 'Digital')} />
                <Checkbox label="Physical" checked={filters.format?.includes('Physical')} onChange={() => handleCheckboxChange('format', 'Physical')} />
            </FilterSection>

            {/* Status */}
            <FilterSection title="Status">
                <Checkbox label="To Read" checked={filters.status?.includes('To Read')} onChange={() => handleCheckboxChange('status', 'To Read')} />
                <Checkbox label="In Progress" checked={filters.status?.includes('In Progress')} onChange={() => handleCheckboxChange('status', 'In Progress')} />
                <Checkbox label="Read" checked={filters.status?.includes('Read')} onChange={() => handleCheckboxChange('status', 'Read')} />
                <Checkbox label="Abandoned" checked={filters.status?.includes('Abandoned')} onChange={() => handleCheckboxChange('status', 'Abandoned')} />
            </FilterSection>

            {/* Rating */}
            <FilterSection title="Rating">
                {[5, 4, 3, 2, 1].map(stars => (
                    <Checkbox
                        key={stars}
                        label={`${stars} Stars`}
                        checked={filters.rating?.includes(stars)}
                        onChange={() => handleCheckboxChange('rating', stars)}
                    />
                ))}
            </FilterSection>
        </div>
    );
};

const FilterSection = ({ title, children }) => (
    <div style={{ marginBottom: '25px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: '15px' }}>{title}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {children}
        </div>
    </div>
);

const Checkbox = ({ label, checked, onChange }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'var(--color-text)' }}>
        <input
            type="checkbox"
            checked={!!checked}
            onChange={onChange}
            style={{
                width: '16px', height: '16px', accentColor: 'var(--color-accent)', cursor: 'pointer'
            }}
        />
        {label}
    </label>
);

export default ArchiveFilters;
