// Responsive poster grid: 2 columns on small phones, filling tablets, and a
// fixed 6 on laptops so a 12-result search page is exactly two full rows.
export const movieGridSx = {
    display: 'grid',
    gridTemplateColumns: {
        xs: 'repeat(auto-fill, minmax(clamp(140px, 42vw, 200px), 1fr))',
        lg: 'repeat(6, minmax(0, 1fr))',
    },
    gap: { xs: 1.5, sm: 2, md: 3 },
    width: '100%',
};
