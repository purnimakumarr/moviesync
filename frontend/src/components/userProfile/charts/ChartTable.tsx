import { useTranslation } from 'react-i18next';
import { visuallyHidden } from '@mui/utils';

import { ChartDatum } from './types';

// The same numbers as a table, for screen readers.
const ChartTable = ({ caption, data }: { caption: string; data: ChartDatum[] }) => {
    const { t } = useTranslation();
    return (
        // Hidden on a wrapping div: tables ignore height/overflow, so a hidden
        // <table> keeps its full height and can stretch the page.
        <div style={visuallyHidden as React.CSSProperties}>
            <table>
                <caption>{caption}</caption>
                <thead>
                    <tr>
                        <th scope="col">{t('profile.table_name')}</th>
                        <th scope="col">{t('profile.table_titles')}</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((datum) => (
                        <tr key={datum.label}>
                            <th scope="row">{datum.label}</th>
                            <td>{datum.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ChartTable;
