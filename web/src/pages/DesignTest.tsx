import React, { useEffect } from 'react';
import App from '../design-test/App';

const DesignTestPage: React.FC = () => {
    useEffect(() => {
        console.log('DesignTestPage mounted');
    }, []);

    return (
        <div id="design-test-root">
            <App />
        </div>
    );
};

export default DesignTestPage;
