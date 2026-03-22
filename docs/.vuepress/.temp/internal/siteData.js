export const siteData = JSON.parse("{\"base\":\"/\",\"lang\":\"fr-FR\",\"title\":\"FILM-IA Docs\",\"description\":\"Documentation interne pour la plateforme Moovies par IA\",\"head\":[[\"meta\",{\"name\":\"viewport\",\"content\":\"width=device-width, initial-scale=1\"}],[\"meta\",{\"name\":\"theme-color\",\"content\":\"#111827\"}]],\"locales\":{\"/\":{\"lang\":\"fr-FR\",\"title\":\"FILM-IA Docs\",\"description\":\"Documentation interne pour la plateforme Moovies par IA\"}}}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  __VUE_HMR_RUNTIME__.updateSiteData?.(siteData)
}

if (import.meta.hot) {
  import.meta.hot.accept((m) => {
    __VUE_HMR_RUNTIME__.updateSiteData?.(m.siteData)
  })
}
