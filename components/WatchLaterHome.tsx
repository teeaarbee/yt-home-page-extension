import React, { useEffect, useState } from 'react';
import { getWatchLaterVideos, Video } from '../utils/youtube';
import './WatchLaterHome.css';

const WatchLaterHome: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideos = async () => {
            const data = await getWatchLaterVideos();
            setVideos(data);
            setLoading(false);
        };
        fetchVideos();
    }, []);

    if (loading) {
        return <div className="wl-loading">Loading Watch Later...</div>;
    }

    if (videos.length === 0) {
        return <div className="wl-empty">No videos found in Watch Later or not logged in.</div>;
    }

    return (
        <div className="wl-container">
            <h1 className="wl-title">Watch Later</h1>
            <div className="wl-grid">
                {videos.map((video) => (
                    <a key={video.id} href={video.url} className="wl-card">
                        <div className="wl-thumbnail-wrapper">
                            <img src={video.thumbnail} alt={video.title} className="wl-thumbnail" />
                            <span className="wl-duration">{video.duration}</span>
                        </div>
                        <div className="wl-info">
                            <h3 className="wl-video-title" title={video.title}>{video.title}</h3>
                            <div className="wl-meta">
                                <span className="wl-channel">{video.channelName}</span>
                                {/* <span className="wl-views">{video.views}</span> */}
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default WatchLaterHome;
