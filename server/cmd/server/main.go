package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/hypertweet/server/internal/ai"
	"github.com/hypertweet/server/internal/auth"
	"github.com/hypertweet/server/internal/config"
	"github.com/hypertweet/server/internal/db"
	"github.com/hypertweet/server/internal/middleware"
	"github.com/hypertweet/server/internal/profiles"
	"github.com/hypertweet/server/internal/tones"
	"github.com/hypertweet/server/internal/tracing"
)

func main() {
	log := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	cfg, err := config.Load()
	if err != nil {
		log.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	ctx := context.Background()
	database, err := db.Connect(ctx, cfg.MongoURI, cfg.DatabaseName)
	if err != nil {
		log.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	log.Info("connected to database", "database", cfg.DatabaseName)

	userRepo := auth.NewUserRepo(database)
	profileRepo := profiles.NewProfileRepo(database)
	toneRepo := tones.NewToneRepo(database)
	traceRepo := tracing.NewTraceRepo(database)

	log.Info("generating database indexes...")
	if err := userRepo.EnsureIndexes(ctx); err != nil {
		log.Error("failed to create user indexes", "error", err)
		os.Exit(1)
	}
	if err := traceRepo.EnsureIndexes(ctx); err != nil {
		log.Error("failed to create trace indexes", "error", err)
		os.Exit(1)
	}
	log.Info("database indexes generated")

	authService := auth.NewAuthService(cfg.JwtSecret, cfg.JwtIssuer, cfg.JwtAudience, cfg.JwtExpiryDays)
	groqClient := ai.NewGroqClient(cfg.GroqAPIKey)
	aiService := ai.NewService(groqClient, userRepo, profileRepo, toneRepo, traceRepo)

	authHandler := auth.NewHandler(userRepo, authService, log)
	profileHandler := profiles.NewHandler(profileRepo, userRepo, log)
	toneHandler := tones.NewHandler(toneRepo, userRepo, log)
	aiHandler := ai.NewHandler(aiService, log)

	authMiddleware := middleware.NewAuthMiddleware(cfg.JwtSecret, cfg.JwtIssuer, cfg.JwtAudience)

	mux := http.NewServeMux()

	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("working"))
	})

	mux.HandleFunc("POST /auth/register", authHandler.Register)
	mux.HandleFunc("POST /auth/login", authHandler.Login)
	mux.HandleFunc("POST /auth/refresh", authHandler.Refresh)

	protected := http.NewServeMux()
	protected.HandleFunc("GET /profile", profileHandler.GetProfile)
	protected.HandleFunc("POST /profile/update", profileHandler.UpdateProfile)
	protected.HandleFunc("POST /profile/password", profileHandler.UpdatePassword)
	protected.HandleFunc("DELETE /users", profileHandler.DeleteUser)
	protected.HandleFunc("GET /profile/available-models", profileHandler.ListModels)

	protected.HandleFunc("GET /tones", toneHandler.List)
	protected.HandleFunc("POST /tones", toneHandler.Create)
	protected.HandleFunc("PUT /tones/{id}", toneHandler.Update)
	protected.HandleFunc("DELETE /tones/{id}", toneHandler.Delete)
	protected.HandleFunc("POST /tones/{id}/toggle", toneHandler.ToggleDefault)

	protected.HandleFunc("POST /ai/reply", aiHandler.Reply)
	protected.HandleFunc("POST /ai/refine", aiHandler.Refine)
	protected.HandleFunc("POST /ai/chat", aiHandler.Chat)

	mux.Handle("/", authMiddleware.Protect(protected))

	handler := middleware.CORS(mux)
	handler = middleware.Logging(log)(handler)

	addr := fmt.Sprintf("0.0.0.0:%s", cfg.Port)
	srv := &http.Server{
		Addr:    addr,
		Handler: handler,
	}

	go func() {
		log.Info("server starting", "addr", addr)
		if err := srv.ListenAndServe(); err != http.ErrServerClosed {
			log.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error("server shutdown error", "error", err)
	}

	if err := db.Disconnect(shutdownCtx, database); err != nil {
		log.Error("database disconnect error", "error", err)
	}

	log.Info("server stopped")
}
