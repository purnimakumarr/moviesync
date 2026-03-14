import { Route, Routes } from "react-router-dom";

import Layout from "../Layout";
import Home from "../pages/Home";
import Search from '../pages/Search';
import MoviePage from "../pages/Movie";
import Featured from "../pages/Featured";
import ProtectedRoutes from "./ProtectedRoutes";
import UserProfile from "../pages/UserProfile";
import Favourites from "../pages/Favourites";
import WatchLaterPage from "../pages/WatchLaterPage";
import Watched from "../pages/Watched";

function AppRoutes() {
    return (
        <>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="search" element={<Search />} />
                    <Route path="movie/:imdbID" element={<MoviePage />} />
                    <Route path="featured" element={<Featured />} />
                    <Route element={<ProtectedRoutes />}>
                        <Route path="user" element={<UserProfile />} />
                        <Route path="favourites" element={<Favourites />} />
                        <Route path="watch-later" element={<WatchLaterPage />} />
                        <Route path="watched" element={<Watched />} />
                    </Route>
                </Route>
            </Routes>
        </>
    );
}

export default AppRoutes;
