export interface Video {
    id: string;
    setVideoId: string; // Added for removal
    title: string;
    thumbnail: string;
    duration: string;
    channelName: string;
    channelUrl: string;
    views: string;
    url: string;
}

export async function getWatchLaterVideos(): Promise<Video[]> {
    try {
        const response = await fetch('https://www.youtube.com/playlist?list=WL');
        const text = await response.text();

        // Extract ytInitialData
        const jsonMatch = text.match(/var ytInitialData = ({.*?});/);
        if (!jsonMatch) {
            console.error('Could not find ytInitialData');
            return [];
        }

        const data = JSON.parse(jsonMatch[1]);

        // Navigate through the JSON to find videos
        // This path is based on typical YouTube structure but might need adjustment
        const contents = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;

        if (!contents) {
            console.error('Could not find video list in ytInitialData');
            return [];
        }

        const videos: Video[] = contents
            .map((item: any) => item.playlistVideoRenderer)
            .filter((item: any) => item) // Filter out nulls or non-video items
            .map((item: any) => {
                // Debug logging to find setVideoId
                if (!item.setVideoId) {
                    console.log('Missing setVideoId for item:', item);
                }
                return {
                    id: item.videoId,
                    setVideoId: item.setVideoId || '', // Extract setVideoId
                    title: item.title.runs[0].text,
                    thumbnail: item.thumbnail.thumbnails.pop()?.url || '', // Get largest thumbnail
                    duration: item.lengthText?.simpleText || '',
                    channelName: item.shortBylineText?.runs[0]?.text || '',
                    channelUrl: item.shortBylineText?.runs[0]?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url || '',
                    views: item.videoInfo?.runs?.[0]?.text || '', // Sometimes views are here
                    url: `/watch?v=${item.videoId}&list=WL`, // Keep it in the playlist context
                };
            });

        return videos;
    } catch (error) {
        console.error('Error fetching Watch Later videos:', error);
        return [];
    }
}

let cachedApiKey = '';
let cachedClientVersion = '';

async function getClientConfig() {
    if (cachedApiKey && cachedClientVersion) return { apiKey: cachedApiKey, clientVersion: cachedClientVersion };

    try {
        const response = await fetch('https://www.youtube.com/playlist?list=WL');
        const text = await response.text();

        const apiKeyMatch = text.match(/"INNERTUBE_API_KEY":"(.*?)"/);
        const clientVersionMatch = text.match(/"INNERTUBE_CLIENT_VERSION":"(.*?)"/);

        if (apiKeyMatch) cachedApiKey = apiKeyMatch[1];
        if (clientVersionMatch) cachedClientVersion = clientVersionMatch[1];

        return { apiKey: cachedApiKey, clientVersion: cachedClientVersion };
    } catch (e) {
        console.error('Error fetching client config', e);
        return { apiKey: '', clientVersion: '' };
    }
}

export async function removeVideoFromWatchLater(setVideoId: string): Promise<boolean> {
    console.log('removeVideoFromWatchLater called with:', setVideoId);
    const { apiKey, clientVersion } = await getClientConfig();
    if (!apiKey || !clientVersion) {
        console.error('Could not find API key or client version');
        return false;
    }

    try {
        const response = await fetch(`https://www.youtube.com/youtubei/v1/browse/edit_playlist?key=${apiKey}`, {
            method: 'POST',
            credentials: 'include', // Important for sending cookies
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                context: {
                    client: {
                        clientName: 'WEB',
                        clientVersion: clientVersion,
                    },
                },
                actions: [
                    {
                        action: 'ACTION_REMOVE_VIDEO_BY_SET_VIDEO_ID',
                        setVideoId: setVideoId,
                    },
                ],
                playlistId: 'WL',
            }),
        });

        console.log('Remove video response status:', response.status); // Debug logging

        // Check if response is OK (200-299)
        if (!response.ok) {
            console.error('API request failed with status:', response.status);
            return false;
        }

        // Get the response text first
        const responseText = await response.text();
        console.log('Remove video response text:', responseText); // Debug logging

        // If the response is empty, but status was OK, consider it a success
        if (!responseText || responseText.trim() === '') {
            console.log('Empty response but status was OK, treating as success');
            return true;
        }

        // Try to parse as JSON
        try {
            const data = JSON.parse(responseText);
            console.log('Remove video response data:', data); // Debug logging
            return data.status === 'STATUS_SUCCEEDED' || !!data.actions;
        } catch (jsonError) {
            console.warn('Could not parse response as JSON, but request succeeded');
            return true; // If status was OK but response isn't JSON, still consider it success
        }
    } catch (error) {
        console.error('Error removing video:', error);
        return false;
    }
}
