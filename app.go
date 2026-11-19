package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"syscall"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// App is the Go service exposed to the frontend. Wails generates the bindings
// from its exported methods (see frontend/bindings/progress/).
type App struct {
	app *application.App

	savedFileLocation string
	jsonData          string
}

// NewApp creates a new App application struct.
func NewApp() *App {
	return &App{}
}

// ServiceStartup is called at application startup.
func (b *App) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	b.app = application.Get()
	b.app.Logger.Info("START startup")

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("can't fetch user home directory: %w", err)
	}

	savedFileLocation := filepath.Join(homeDir, "wail_progress", "data.json")
	data, err := os.ReadFile(savedFileLocation)

	if err != nil {
		if errors.Is(err, syscall.ENOENT) {
			err = os.MkdirAll(filepath.Dir(savedFileLocation), 0755)
			if err != nil {
				return err
			}

			err = os.WriteFile(savedFileLocation, []byte("{}"), 0666)
			if err != nil {
				return err
			}
			data = []byte("{}")
		} else {
			return err
		}
	}
	b.savedFileLocation = savedFileLocation
	b.SetJsonData(string(data))
	return nil
}

// ServiceShutdown is called at application termination.
func (b *App) ServiceShutdown() error {
	return b.save()
}

func (b *App) SetJsonData(jsonData string) {
	b.jsonData = jsonData
}

func (b *App) GetJsonData() string {
	return b.jsonData
}

func (b *App) SaveJsonData(jsonData string) error {
	b.SetJsonData(jsonData)
	return b.save()
}

func (b *App) save() error {
	if b.savedFileLocation == "" {
		return nil
	}
	err := os.WriteFile(b.savedFileLocation, []byte(b.jsonData), 0666)
	if err != nil {
		return err
	}
	return nil
}

// ConfirmDelete shows a native question dialog and blocks until the user picks
// a button. v3 dialogs are callback based, so the result is passed back over a
// channel; the caller runs on a binding goroutine, not the UI thread.
func (b *App) ConfirmDelete() bool {
	result := make(chan bool, 1)

	yes := &application.Button{Label: "Yes"}
	yes.OnClick(func() { result <- true })

	no := &application.Button{Label: "No", IsDefault: true, IsCancel: true}
	no.OnClick(func() { result <- false })

	b.app.Dialog.Question().
		SetTitle("Do you really want to delete?").
		SetMessage("Confirm").
		AddButtons([]*application.Button{yes, no}).
		SetDefaultButton(no).
		SetCancelButton(no).
		Show()

	return <-result
}
