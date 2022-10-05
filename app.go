package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"syscall"

	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context

	savedFileLocation string
	jsonData          string

	logger logger.Logger
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		logger: logger.NewDefaultLogger(),
	}
}

// startup is called at application startup
func (b *App) startup(ctx context.Context) {
	// Perform your setup here
	b.ctx = ctx

	b.logger.Info("START startup")

	homeDir, err := os.UserHomeDir()
	if err != nil {
		panic("can't fetch user home directory")
	}

	savedFileLocation := filepath.Join(homeDir, "wail_progress", "data.json")
	data, err := os.ReadFile(savedFileLocation)

	if err != nil {
		newError := errors.Unwrap(err)
		fmt.Println(newError)
		if errors.Is(err, syscall.ENOENT) {
			err := os.Mkdir(filepath.Join(homeDir, "wail_progress"), 0755)
			if err != nil {
				panic(err)
			}

			err = os.WriteFile(savedFileLocation, []byte("{}"), 0666)
			if err != nil {
				panic(err)
			}
			data = []byte("{}")
		} else {
			fmt.Printf("%v->\n", err)
			panic(err)
		}
	}
	b.savedFileLocation = savedFileLocation
	b.SetJsonData(string(data))
}

// domReady is called after the front-end dom has been loaded
func (b *App) domReady(ctx context.Context) {
	// Add your action here
}

// shutdown is called at application termination
func (b *App) shutdown(ctx context.Context) {
	b.save()
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
	err := os.WriteFile(b.savedFileLocation, []byte(b.jsonData), 0666)
	if err != nil {
		return err
	}
	return nil
}

func (b *App) ConfirmDelete() bool {
	selection, err := runtime.MessageDialog(b.ctx, runtime.MessageDialogOptions{
		Title:         "Do you really want to delete?",
		Message:       "Confirm",
		Buttons:       []string{"Yes", "No"},
		DefaultButton: "No",
		CancelButton:  "No",
	})

	if err != nil {
		return false
	}

	return selection == "Yes"
}
