package main

import (
	"embed"
	"log"
	"log/slog"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var icon []byte

func main() {
	progressApp := NewApp()

	app := application.New(application.Options{
		Name:        "Progress",
		Description: "Plan your studies and keep track of your progress",
		Icon:        icon,
		LogLevel:    slog.LevelDebug,
		Services: []application.Service{
			application.NewService(progressApp),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			// Match v2: closing the window leaves the app running until the
			// user quits it explicitly.
			ApplicationShouldTerminateAfterLastWindowClosed: false,
		},
	})

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:     "Progress",
		Width:     960,
		Height:    840,
		MinWidth:  720,
		MinHeight: 570,
		// #21252b; the page itself is opaque, this only avoids a white flash.
		BackgroundColour: application.NewRGB(33, 37, 43),
		URL:              "/",
		Mac: application.MacWindow{
			TitleBar: application.MacTitleBar{
				AppearsTransparent:   false,
				Hide:                 false,
				HideTitle:            false,
				FullSizeContent:      false,
				UseToolbar:           false,
				HideToolbarSeparator: true,
			},
			Appearance: application.NSAppearanceNameVibrantLight,
		},
	})

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
