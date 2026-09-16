<script>
	import { onDestroy } from 'svelte';
	import {
		formatSignedSeconds,
		paceTone,
		paceToneLabel
	} from '/src/lib/recordComparison.js';

	/**
	 * @type {{
	 *   id: string,
	 *   verseDelta: number | null,
	 *   cumulativeDelta: number | null,
	 *   verseLabel?: string
	 * } | null}
	 */
	export let flash = null;
	export let durationMs = 2500;

	let visible = false;
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let hideTimer;

	$: if (flash && flash.id) {
		visible = true;
		clearTimeout(hideTimer);
		hideTimer = setTimeout(() => {
			visible = false;
		}, durationMs);
	} else {
		visible = false;
		clearTimeout(hideTimer);
	}

	onDestroy(() => clearTimeout(hideTimer));
</script>

<div class="pace-slot" aria-live="polite">
	{#if flash && visible}
		{#key flash.id}
			<div class="pace-flash" style="--pace-duration: {durationMs}ms" role="status">
				<div class="header">Față de recordul local</div>
				<div class="rows">
					{#if flash.verseDelta != null}
						<div class="row">
							<span class="label"
								>{flash.verseLabel ? `Verset ${flash.verseLabel}` : 'Acest verset'}</span
							>
							<span class="value {paceTone(flash.verseDelta)}"
								>{formatSignedSeconds(flash.verseDelta)}</span
							>
							<span class="hint {paceTone(flash.verseDelta)}"
								>{paceToneLabel(paceTone(flash.verseDelta))}</span
							>
						</div>
					{/if}
					{#if flash.cumulativeDelta != null}
						<div class="row">
							<span class="label">Total</span>
							<span class="value {paceTone(flash.cumulativeDelta)}"
								>{formatSignedSeconds(flash.cumulativeDelta)}</span
							>
							<span class="hint {paceTone(flash.cumulativeDelta)}"
								>{paceToneLabel(paceTone(flash.cumulativeDelta))}</span
							>
						</div>
					{/if}
				</div>
			</div>
		{/key}
	{/if}
</div>

<style>
	.pace-slot {
		min-height: 0;
	}
	.pace-flash {
		display: inline-block;
		margin: 8px 0 0;
		padding: 8px 12px;
		border-radius: 8px;
		border: 1px solid #d8d8d8;
		background: rgba(255, 255, 255, 0.92);
		animation: pace-in-out var(--pace-duration, 2.5s) ease forwards;
		pointer-events: none;
	}
	.header {
		font-size: 0.8em;
		color: #666;
		margin-bottom: 4px;
	}
	.rows {
		display: flex;
		flex-wrap: wrap;
		gap: 10px 22px;
	}
	.row {
		display: flex;
		align-items: baseline;
		gap: 8px;
		font-variant-numeric: tabular-nums;
	}
	.label {
		color: #444;
		font-size: 0.92em;
	}
	.value {
		font-weight: bold;
		font-size: 1.05em;
	}
	.hint {
		font-size: 0.85em;
	}
	.ahead {
		color: #1b7a3d;
	}
	.behind {
		color: #b3261e;
	}
	.even {
		color: #555;
	}
	@keyframes pace-in-out {
		0% {
			opacity: 0;
			transform: translateY(-4px);
		}
		12% {
			opacity: 1;
			transform: translateY(0);
		}
		78% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
	:global(body.dark-mode) .pace-flash {
		background: rgba(22, 32, 42, 0.94);
		border-color: #3a4c61;
	}
	:global(body.dark-mode) .header {
		color: #9aa6b4;
	}
	:global(body.dark-mode) .label {
		color: #d7d7d7;
	}
	:global(body.dark-mode) .ahead {
		color: #7dcea0;
	}
	:global(body.dark-mode) .behind {
		color: #f1948a;
	}
	:global(body.dark-mode) .even {
		color: #b9c3cf;
	}
</style>
