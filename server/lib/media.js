'use strict';

const YT_RE =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

const DRIVE_FILE_RE = /drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/;
const DRIVE_UC_RE = /drive\.google\.com\/uc\?.*[?&]id=([A-Za-z0-9_-]+)/;

function getYouTubeId(url) {
  if (!url) return null;
  const m = String(url).match(YT_RE);
  return m ? m[1] : null;
}

function getYouTubeEmbed(url) {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

function getYouTubeThumb(url) {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

function getDriveFileId(url) {
  if (!url) return null;
  let m = String(url).match(DRIVE_FILE_RE);
  if (m) return m[1];
  m = String(url).match(DRIVE_UC_RE);
  if (m) return m[1];
  return null;
}

function getDrivePreview(url) {
  const id = getDriveFileId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : null;
}

function getTelegramLink(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (/^(https?:\/\/)?t\.me\//i.test(s)) {
    return s.startsWith('http') ? s : `https://${s}`;
  }
  return null;
}

module.exports = {
  getYouTubeId,
  getYouTubeEmbed,
  getYouTubeThumb,
  getDriveFileId,
  getDrivePreview,
  getTelegramLink,
};
