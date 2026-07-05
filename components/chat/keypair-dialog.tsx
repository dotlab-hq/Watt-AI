"use client";

import { type FormEvent, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

export function CreateKeyPairDialog({
  open,
  onSubmit,
}: {
  open: boolean;
  onSubmit: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      await onSubmit(password);
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable PII Protection</AlertDialogTitle>
            <AlertDialogDescription>
              Create an encryption key to protect your personal information.
              Your data will be encrypted before leaving your device.
              Choose a strong password — it cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Encryption password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Skip for now</AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={loading || password.length < 8}>
              {loading ? "Creating..." : "Create Key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function UnlockKeyPairDialog({
  open,
  onSubmit,
}: {
  open: boolean;
  onSubmit: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(false);
    try {
      await onSubmit(password);
      setPassword("");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlock PII Protection</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your encryption password to restore your personal information
              in previous messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Encryption password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-destructive">
                Incorrect password. Please try again.
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Skip</AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={loading || !password}>
              {loading ? "Unlocking..." : "Unlock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
