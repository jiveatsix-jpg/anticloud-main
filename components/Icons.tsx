import React from 'react';

const iconProps: React.SVGProps<SVGSVGElement> = {
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const ArrowLeftIcon = () => <svg {...iconProps}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
export const ArrowRightIcon = () => <svg {...iconProps}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;
export const SettingsIcon = () => <svg {...iconProps}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
export const DeleteIcon = () => <svg {...iconProps}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
export const EditIcon = () => <svg {...iconProps}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
export const DuplicateIcon = () => <svg {...iconProps}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>;
export const SendToBackIcon = () => <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="14" height="14" rx="2" ry="2" fill="currentColor" strokeWidth="0"></rect></svg>;
export const DownloadIcon = () => <svg {...iconProps}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
export const TitleIcon = () => <svg {...iconProps}><path d="M4 7V4h16v3"></path><path d="M12 7v13"></path><path d="M8 20h8"></path></svg>;
export const TextboxIcon = () => <svg {...iconProps}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
export const PixelIcon = () => <svg {...iconProps}><path d="M10.3 21.7c.4.4.8.4 1.2 0l8.2-8.2c.4-.4.4-.8 0-1.2l-6.4-6.4c-.4-.4-.8-.4-1.2 0L3.9 13.9c-.4.4-.4.8 0 1.2l6.4 6.6z"></path><path d="m21.7 3.9-8.2 8.2"></path><path d="m13.5 12.3 1.2-1.2"></path><path d="m11.1 14.7 1.2-1.2"></path><path d="m8.7 17.1 1.2-1.2"></path><path d="m6.3 19.5 1.2-1.2"></path><path d="M3.9 21.7 12 13.5"></path></svg>;
export const SpriteIcon = () => <svg {...iconProps}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>;
export const BoardPrevIcon = () => <svg {...iconProps}><polyline points="15 18 9 12 15 6"></polyline></svg>;
export const BoardNextIcon = () => <svg {...iconProps}><polyline points="9 18 15 12 9 6"></polyline></svg>;
export const GridIcon = () => <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>;
export const CameraIcon = () => <svg {...iconProps}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
export const CropIcon = () => <svg {...iconProps}><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path></svg>;
export const FullscreenIcon = () => <svg {...iconProps}><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>;
export const DpadUpIcon = () => <svg {...iconProps}><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
export const DpadDownIcon = () => <svg {...iconProps}><path d="M12 5v14m-7-7l7 7 7-7" /></svg>;
export const DpadLeftIcon = () => <svg {...iconProps}><path d="M19 12H5m7 7-7-7 7-7" /></svg>;
export const DpadRightIcon = () => <svg {...iconProps}><path d="M5 12h14m-7-7 7 7-7 7" /></svg>;
export const ChevronDownIcon = () => <svg {...iconProps}><path d="m6 9 6 6 6-6" /></svg>;
export const ChevronUpIcon = () => <svg {...iconProps}><path d="m18 15-6-6-6 6" /></svg>;
export const PaletteIcon = () => <svg {...iconProps}><path d="M13.5 2c-5.621 0-10.211 4.44-10.475 10 .01.166.024.332.024.5 0 5.523 4.477 10 10 10 4.237 0 7.85-2.67 9.343-6.417.155-.38.297-.768.42-1.168.12-.39.227-.79.322-1.196.096-.407.173-.824.238-1.25.064-.42.112-.85.143-1.289.032-.44.048-.888.048-1.345C24 6.477 19.523 2 13.5 2z"></path><path d="M9 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path><path d="M12.5 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path><path d="M16 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path></svg>;
export const SparklesIcon = () => <svg {...iconProps}><path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z M 22 2 L 20 7 L 15 9 L 20 11 L 22 16 L 24 11 L 29 9 L 24 7 L 22 2 Z M 5 15 L 7 20 L 2 18 L 7 16 L 5 11 L 10 13 L 5 15 Z" strokeWidth="1.5" fill="currentColor" /></svg>;
export const HelpIcon = () => <svg {...iconProps}><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
export const CopyIcon = () => <svg {...iconProps}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>;
export const PasteIcon = () => <svg {...iconProps}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>;
export const PlusIcon = () => <svg {...iconProps}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
export const LayersIcon = () => <svg {...iconProps}><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;
export const SelectIcon = () => <svg {...iconProps}><path d="M5 3l3.057 14.943 4.443-4.443 4.5 4.5 2-2-4.5-4.5 4.443-4.443z" /></svg>;
export const FrameIcon = () => <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="1" ry="1"></rect><path d="M7 3v4h-4M17 3v4h4M7 21v-4H3M17 21v-4h4"></path><line x1="9" y1="9" x2="15" y2="15"></line><path d="M15 9l-3.5 1.5L15 15l1.5-3.5z" fill="currentColor" strokeWidth="0"></path></svg>;
export const SmartphoneIcon = () => <svg {...iconProps}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>;
export const CounterIcon = () => <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M8 7v10M12 7v10M16 7v10" /></svg>;
export const MusicIcon = () => <svg {...iconProps}><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>;
export const TimerIcon = () => <svg {...iconProps}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M20 12h2"></path><path d="M2 12h2"></path></svg>;
export const PlayIcon = () => <svg {...iconProps}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
export const PauseIcon = () => <svg {...iconProps}><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>;
export const ResetIcon = () => <svg {...iconProps}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>;
export const FileIcon = () => <svg {...iconProps}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>;
export const CheckboxIcon = () => <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><polyline points="9 11 12 14 22 4"></polyline></svg>;
export const TextIcon = () => <svg {...iconProps}><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>;
export const SuggestionIcon = () => <svg {...iconProps}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-10.6 8.38 8.38 0 0 1 3.8.9L21 3.5Z"></path><path d="M12 12h.01"></path><path d="M16 12h.01"></path><path d="M8 12h.01"></path></svg>;
export const XIcon = () => <svg {...iconProps}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
export const TrashIcon = () => <svg {...iconProps}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
export const ArrowUpIcon = () => <svg {...iconProps}><polyline points="18 15 12 9 6 15"></polyline></svg>;
export const ArrowDownIcon = () => <svg {...iconProps}><polyline points="6 9 12 15 18 9"></polyline></svg>;
export const LinkIcon = () => <svg {...iconProps}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
export const UnlinkIcon = () => <svg {...iconProps}><path d="m18.84 12.25 1.72-1.71h-.01a5.001 5.001 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="m5.17 11.75-1.71 1.71a5.001 5.001 0 0 0 7.07 7.07l1.71-1.71"></path><line x1="8" y1="2" x2="8" y2="5"></line><line x1="2" y1="8" x2="5" y2="8"></line><line x1="16" y1="22" x2="16" y2="19"></line><line x1="22" y1="16" x2="19" y2="16"></line></svg>;
export const HomeIcon = () => <svg {...iconProps}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
export const NotesIcon = () => <svg {...iconProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><line x1="8" y1="9" x2="10" y2="9"></line></svg>;
