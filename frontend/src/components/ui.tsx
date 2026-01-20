import type { ReactNode } from "react";
import type { CSSProperties, ButtonHTMLAttributes } from "react";

type PropsWithChildren = { children: ReactNode };

export function Container({ children }: PropsWithChildren) {
    return (
        <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
            {children}
        </div>
    );
}

export function Card({ children }: PropsWithChildren) {
    return (
        <div
            style={{
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 16,
            }}
        >
            {children}
        </div>
    );
}

export function Row({
    children,
    style,
}: PropsWithChildren & { style?: CSSProperties }) {
    return (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", ...style }}>
            {children}
        </div>
    );
}

export function Field({
    label,
    children,
    hint,
}: {
    label: string;
    children: ReactNode;
    hint?: string;
}) {
    return (
        <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700 }}>
                {label}
            </span>

            {children}

            {hint ? (
                <span style={{ color: "var(--muted)", fontSize: 12 }}>{hint}</span>
            ) : null}
        </label>
    );
}

export function TitleBar({
    title,
    right,
}: {
    title: string;
    right?: ReactNode;
}) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
            }}
        >
            <h1 style={{ margin: 0, fontSize: 44 }}>{title}</h1>
            {right}
        </div>
    );
}

export function SubTitle({ children }: PropsWithChildren) {
    return (
        <div style={{ color: "var(--muted)", marginTop: 6, marginBottom: 12 }}>
            {children}
        </div>
    );
}

export function ErrorBox({ text }: { text: string }) {
    return (
        <div
            style={{
                border: "1px solid #44202a",
                background: "#1a0f13",
                color: "var(--danger)",
                padding: 12,
                borderRadius: 10,
            }}
        >
            {text}
        </div>
    );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    style?: CSSProperties;
};

export function Button({ children, style, ...props }: ButtonProps) {
    return (
        <button {...props} style={{ ...style }}>
            {children}
        </button>
    );
}

export function ButtonPrimary({ children, style, ...props }: ButtonProps) {
    return (
        <button
            {...props}
            style={{
                background: "var(--primary)",
                color: "#0b1220",
                border: "1px solid rgba(255,255,255,.1)",
                ...style,
            }}
        >
            {children}
        </button>
    );
}

export function ButtonSecondary({ children, style, ...props }: ButtonProps) {
    return (
        <button
            {...props}
            style={{
                background: "var(--panel2)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                ...style,
            }}
        >
            {children}
        </button>
    );
}