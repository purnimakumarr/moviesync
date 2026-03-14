import { Pagination, useMediaQuery, useTheme } from "@mui/material";
import Grid from '@mui/material/Grid2';

type PaginationProps = {
    totalPages: number;
    page: number;
    handlePageChange: (event: React.ChangeEvent<unknown>, value: number) => void;
};

function PaginationComponent({ totalPages, page, handlePageChange }: PaginationProps) {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
    return (
        <Grid container justifyContent="center" sx={{ paddingY: '2rem' }}>
            <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" size={isSmallScreen ? "small" : "medium"}
                siblingCount={isSmallScreen ? 0 : 1}
                boundaryCount={isSmallScreen ? 1 : 2}
            />
        </Grid>
    )
}

export default PaginationComponent;