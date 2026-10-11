use std::path::PathBuf;

use rustypipe::param::StreamFilter;
use rustypipe_downloader::Downloader;
use tauri::Manager;

/// YouTube video IDs are exactly 11 characters of [A-Za-z0-9_-].
/// IDs arrive from students over P2P, so this is the trust boundary before touching the filesystem.
fn is_video_id(id: &str) -> bool {
    id.len() == 11
        && id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'-')
}

/// Downloads a video's audio into the app cache and returns the file path.
#[tauri::command]
async fn download(app: tauri::AppHandle, video_id: String) -> Result<PathBuf, String> {
    if !is_video_id(&video_id) {
        return Err(format!("invalid video id: {video_id}"));
    }
    let dir = app.path().app_cache_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    // shortcut: cache is never pruned, add cleanup if disk use becomes a problem
    if let Some(cached) = std::fs::read_dir(&dir)
        .map_err(|e| e.to_string())?
        .filter_map(|entry| entry.ok().map(|entry| entry.path()))
        .find(|path| path.file_stem().is_some_and(|stem| stem == video_id.as_str()))
    {
        return Ok(cached);
    }

    let downloader = Downloader::builder()
        .stream_filter(StreamFilter::new().no_video())
        .build();
    let result = downloader
        .id(&video_id)
        .to_file(dir.join(&video_id))
        .download()
        .await
        .map_err(|e| e.to_string())?;
    Ok(result.dest)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![download])
        .run(tauri::generate_context!())
        .expect("error while running jukebox");
}

#[cfg(test)]
mod tests {
    use super::is_video_id;

    #[test]
    fn validates_video_ids() {
        assert!(is_video_id("dQw4w9WgXcQ"));
        assert!(is_video_id("a-b_c-d_e-f"));
        assert!(!is_video_id(""));
        assert!(!is_video_id("dQw4w9WgXc"));
        assert!(!is_video_id("../../etc/p"));
        assert!(!is_video_id("dQw4w9WgXcQQ"));
    }
}
