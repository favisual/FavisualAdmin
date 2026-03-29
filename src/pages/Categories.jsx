import {Outlet} from 'react-router-dom';

function Categories() {
    return (
        <>
            <div className='min-h-screen w-11/12 ml-auto px-4 md:px-8 lg:px-16'>
                <Outlet />
            </div>
        </>
    );
}

export default Categories;