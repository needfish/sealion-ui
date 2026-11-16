import { createEffect, createRenderEffect, createSignal, For, Show, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import ChevronRight from "lucide-solid/icons/chevron-right";
import Package from "lucide-solid/icons/package";

/* Layout roles */

export const Window = (props) => {
  const [hasSb, setHasSb] = createSignal(false);
  const [sb, setSb] = createSignal(false);
  let el;
  onMount(() => setHasSb(!!el.querySelector(".sidebar")));
  return (
    <div ref={el} class="window" classList={{ "sb-open": sb() }}
      onClick={(e) => sb() && e.target.closest(".sidebar-item") && setSb(false)}>
      <Show when={props.menus}><MenuBar menus={props.menus} /></Show>
      <div class="body">{props.children}</div>
      <Show when={hasSb()}>
        <button class="sb-toggle" aria-label={sb() ? "Close sidebar" : "Open sidebar"} onClick={() => setSb(!sb())}>{sb() ? "Close" : "Sidebar"}</button>
        <Show when={sb()}><div class="sb-scrim" onClick={() => setSb(false)} /></Show>
      </Show>
    </div>
  );
};

export const SectionLabel = (props) => (
  <div class="section-label">{props.children}</div>
);

export const Sidebar = (props) => <nav class="sidebar">{props.children}</nav>;

export const SidebarItem = (props) => (
  <div class="sidebar-item" classList={{ active: props.selected }} onClick={props.onClick}>
    <Show when={props.icon}><span class="icon">{props.icon}</span></Show>
    <span class="name">{props.children}</span>
    <Show when={props.count != null}><span class="count">{props.count}</span></Show>
  </div>
);

export const Toolbar = (props) => <div class="toolbar">{props.children}</div>;

export const StatusBar = (props) => <div class="statusbar">{props.children}</div>;

/* Actions */

export const Btn = (props) => (
  <button
    class={props.class || props.variant || "default"}
    style={props.style}
    classList={{ btn: true, pressed: props.pressed, danger: props.danger }}
    disabled={props.disabled}
    onClick={props.onClick}
  >
    {props.children}
  </button>
);

export const Field = (props) => (
  <input
    class="field" classList={{ invalid: props.invalid }}
    style={props.style}
    type={props.type || "text"}
    placeholder={props.placeholder}
    value={props.value ?? ""}
    onInput={(e) => props.onInput?.(e.target.value)}
    onKeyDown={(e) => props.onEnter && e.key === "Enter" && props.onEnter()}
  />
);

export const Select = (props) => (
  <select class="field" value={props.value} onChange={(e) => props.onChange?.(e.target.value)}>
    <For each={props.options}>{(o) => <option value={o.value}>{o.label}</option>}</For>
  </select>
);

export const Checkbox = (props) => (
  <label class="choice">
    <input type="checkbox" checked={!!props.checked} onChange={(e) => props.onChange?.(e.target.checked)} />
    {props.label}
  </label>
);

export const Radio = (props) => (
  <For each={props.options}>{(o) => (
    <label class="choice">
      <input type="radio" name={props.name} checked={props.value === o.value} value={o.value}
        onChange={() => props.onChange?.(o.value)} />{o.label}
    </label>
  )}</For>
);

export const Toggle = (props) => (
  <label class="toggle" classList={{ on: props.checked }} onClick={(e) => { e.preventDefault(); props.onChange?.(!props.checked); }}>
    <span class="switch" />{props.label}
  </label>
);

export const Number = (props) => (
  <span class="number">
    <Field type="number" value={props.value} onInput={props.onValue} />
    <Show when={props.unit}><span class="unit">{props.unit}</span></Show>
  </span>
);

export const Slider = (props) => {
  let inp;
  createRenderEffect(() => {
    const v = props.value;
    if (inp && v != null && +inp.value !== v) inp.value = v;
  });
  return (
    <input ref={inp} class="slider" type="range" min={props.min} max={props.max} step={props.step || 1} value={props.value}
      onInput={(e) => props.onChange?.(+e.currentTarget.value)} />
  );
};

/* Display */

export const Badge = (props) => (
  <span class="badge" classList={{ [props.tone || "info"]: true }}>{props.children}</span>
);

export const Bar = (props) => (
  <span class="bar" classList={{ [props.hue]: true }}>
    <span style={{ width: `${props.percent}%` }} />
  </span>
);


export const EmptyState = (props) => (
  <div class="empty">
    <Show when={props.icon}>{props.icon}</Show>
    <div>{props.title}</div>
    <Show when={props.hint}><small>{props.hint}</small></Show>
  </div>
);

export const Text = (props) => (
  <span classList={{
    text: true, muted: props.muted, mono: props.mono,
    ["tx-" + (props.size || "md")]: true,
  }}>{props.children}</span>
);

export const Tabs = (props) => (
  <div class="tabs">
    <For each={props.items}>{(t) => (
      <button onclick={() => props.onSwitch?.(t.key)} classList={{ active: t.key === props.active }}>
        {t.label}
      </button>
    )}</For>
  </div>
);


export const Panel = (props) => {
  const [open, setOpen] = createSignal(!props.collapsed);
  return (
    <div class="panel">
      <button class="pt" onClick={() => setOpen(!open())}>
        <ChevronRight classList={{ "pt-open": open() }} />{props.title}
      </button>
      <Show when={open()}><div class="pc">{props.children}</div></Show>
    </div>
  );
};

export const Table = (props) => {
  const cell = (c, row) => c.render ? c.render(row) : row[c.key];
  const isSel = (row) => Array.isArray(props.selectedKeys)
    ? props.selectedKeys.includes(row[props.rowKey]) : row[props.rowKey] === props.selectedKey;
  /* Finder-style independent column widths: sparse overrides; 1fr freezes to px on first drag */
  const [w, setW] = createSignal({});
  const grid = () => props.columns.map((c) => w()[c.key] ?? c.width).join(" ");
  let headEl;
  const startDrag = (c, e) => {
    const i = props.columns.indexOf(c);
    const mins = props.columns.map((k) => k.min ?? 44);
    const maxs = props.columns.map((k) => k.max === null ? Infinity : k.max ?? 320); /* constant clamp; short columns reach it too */
    e.preventDefault();
    const x0 = e.clientX;
    const base = [...headEl.querySelectorAll(":scope > span")]
      .map((s, j) => Math.max(mins[j], s.getBoundingClientRect().width));
    const baseObj = Object.fromEntries(props.columns.map((k, j) => [k.key, `${base[j]}px`]));
    setW(baseObj);
    const onMove = (ev) => {
      /* Finder: the divider widens its column only; everything right keeps its width and shifts,
         so the table total may extend past the window edge */
      setW({ ...baseObj, [c.key]: `${Math.min(maxs[i], Math.max(mins[i], Math.round(base[i] + ev.clientX - x0)))}px` });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };
  const head = <div class="header" ref={headEl} style={{ "grid-template-columns": grid() }}>
    <For each={props.columns}>{(c, i) => <span classList={{ fixed: !!c.fixed }}>{c.header}{props.resizable && !c.fixed &&
      <i class="colresize" onPointerDown={[startDrag, c]} />}</span>}</For>
  </div>;
  return (
    <div class="twrap" classList={{ resizable: !!props.resizable }}>
      {head}
      {/* scroller wraps rows only, so the header never moves (no rubber-band / sticky lag) */}
      <div class="tbody" onScroll={(e) => headEl && (headEl.style.transform = `translateX(${-e.currentTarget.scrollLeft}px)`)}>
        <For each={props.data}>{(row) => (
        <div class="fileitem" style={{ "grid-template-columns": grid() }}
          classList={{ selected: isSel(row) }}
          onClick={(e) => props.onSelect?.(row, e)}
          onContextMenu={(e) => props.onContextMenu?.(row, e)}
          onDblClick={() => props.onDoubleClick?.(row)}>
          <For each={props.columns}>{(c) => <span class={c.className}>{cell(c, row)}</span>}</For>
        </div>
        )}</For>
        <Show when={props.data.length === 0 && props.empty}>{props.empty}</Show>
      </div>
    </div>
  );
};

/* Middle-ellipsis for free-text cells: trims around the center, full text on hover via title. */
export const Mid = (props) => {
  let host, ctx;
  const [txt, setTxt] = createSignal(props.text ?? "");
  onMount(() => {
    ctx = document.createElement("canvas").getContext("2d");
    const fit = (chars, back, half) => { /* chars kept from the head (or tail) within half the cell */
      let a = 0, n = 0;
      for (const ch of back ? [...chars].reverse() : chars) { a += ctx.measureText(ch).width; if (a > half) break; n++; }
      return n;
    };
    const apply = () => {
      const avail = host.offsetWidth; /* host spans the cell */
      if (!avail || avail < 24) return;
      ctx.font = getComputedStyle(host).font;
      const full = props.text ?? "";
      if (ctx.measureText(full).width <= avail) return setTxt(full);
      const half = (avail - ctx.measureText("…").width) / 2;
      const chars = [...full], keep = Math.max(1, fit(chars, false, half)), tail = Math.max(1, fit(chars, true, half));
      setTxt(chars.slice(0, keep).join("") + "…" + chars.slice(-tail).join(""));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(host);
    onCleanup(() => ro.disconnect());
  });
  return <span ref={host} title={props.text} style={{ display: "block" }}>{txt()}</span>;
};

/* Overlays */

export const Dialog = (props) => {
  let el;
  createEffect(() => { if (props.open) el.showModal(); else if (el.open) el.close(); });
  return (
    <dialog ref={el} class={props.class} onClick={(e) => e.target === el && props.onClose?.()}>
      <Show when={props.title}><h3>{props.title}</h3></Show>
      {props.children}
      <Show when={props.footer}><div class="actions">{props.footer}</div></Show>
    </dialog>
  );
};

export const Confirm = (props) => (
  <Dialog open={props.open} onClose={props.onCancel} title={props.title || "Confirm"}>
    <p>{props.message}</p>
    <div class="actions">
      <Btn onClick={props.onCancel}>Cancel</Btn>
      <Btn danger onClick={props.onConfirm}>{props.confirmLabel || "OK"}</Btn>
    </div>
  </Dialog>
);

export const Tooltip = (props) => {
  const [show, setShow] = createSignal(false);
  const [pos, setPos] = createSignal({ x: 0, y: 0 });
  const place = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.top > 60 ? r.top - 36 : r.bottom + 6 });
    setShow(true);
  };
  return (
    <span class="tip" onMouseEnter={place} onMouseLeave={() => setShow(false)}>
      {props.children}
      <Portal>
        <Show when={show()}>
          <span class="tip-pop" style={{ left: `${Math.max(60, Math.min(window.innerWidth - 60, pos().x))}px`, top: `${pos().y}px` }}>
            {props.label}
          </span>
        </Show>
      </Portal>
    </span>
  );
};

export const Menu = (props) => {
  const [open, setOpen] = createSignal(false);
  return (
    <span class="menu-host">
      <button class="menu-btn" classList={{ pressed: open() }}
        onClick={() => props.onTopClick ? props.onTopClick() : setOpen(!open())}>
        {props.label}
      </button>
      <Show when={open()}>
        <div class="menu" onMouseDown={(e) => e.stopPropagation()}
          ref={() => document.addEventListener("mousedown", (e) => { if (!e.target.closest(".menu-host")) setOpen(false); }, { once: true })}>
          <For each={props.items}>{(item) => item.divider ?
            <div class="divider" /> :
            <div class={item.disabled ? "menu-item disabled" : "menu-item"}
              onClick={() => { if (!item.disabled) { setOpen(false); item.onClick?.(); } }}>
              {item.label}
            </div>}
          </For>
        </div>
      </Show>
    </span>
  );
};

export const MenuBar = (props) => {
  const [open, setOpen] = createSignal(null);
  const [at, setAt] = createSignal({ left: 0, top: 0 });
  const pick = (i, e) => {
    setOpen(null);
    const m = props.menus[i];
    if (m.onTopClick) { m.onTopClick(); return; }
    const r = e.currentTarget.getBoundingClientRect();
    setAt({ left: Math.min(r.left, window.innerWidth - 170), top: r.bottom });
    setOpen(m);
  };
  return (
    <div class="menubar">
      <For each={props.menus}>{(m, i) => (
        <button class="menu-btn" classList={{ pressed: m.label === open()?.label }} onClick={[pick, i()]}>
          {m.label}
        </button>
      )}</For>
      <Portal><Show when={open()}>
        <div class="menu fixed" onMouseDown={(e) => e.stopPropagation()}
          style={{ left: `${at().left}px`, top: `${at().top}px` }}
          ref={(el) => document.addEventListener("click", (e) => { if (!e.target.closest(".menu, .menubar")) setOpen(null); }, { once: true })}>
          <For each={open().items}>{(item) => item.divider ?
            <div class="divider" /> :
            <div class={item.disabled ? "menu-item disabled" : "menu-item"}
              onClick={() => { if (!item.disabled) { setOpen(null); item.onClick?.(); } }}>
              {item.label}
            </div>}
          </For>
        </div>
      </Show></Portal>
    </div>
  );
};

/* Extras */

export const Alert = (props) => (
  <div class="alert" classList={{ [props.tone || "info"]: true }}>
    <Show when={props.title}><strong>{props.title}</strong></Show>
    <span>{props.children}</span>
  </div>
);

export const Breadcrumb = (props) => (
  <nav class="crumbs">
    <For each={props.items}>{(c, i) => (
      <>
        <Show when={i()}><span class="crumb-sep">›</span></Show>
  <a classList={{ here: i() === props.items.length - 1 }} onClick={() => props.onNavigate?.(c)}>{c}</a>
      </>
    )}</For>
  </nav>
);

export const Pagination = (props) => (
  <div class="pager">
    <button disabled={props.page <= 1} onClick={() => props.onPage?.(props.page - 1)}>&lsaquo;</button>
    <For each={[...Array(props.pages).keys()]}>{(_, i) => (
      <button classList={{ active: i() + 1 === props.page }} onClick={() => props.onPage?.(i() + 1)}>{i() + 1}</button>
    )}</For>
    <button disabled={props.page >= props.pages} onClick={() => props.onPage?.(props.page + 1)}>&rsaquo;</button>
  </div>
);

export const Upload = (props) => {
  const [over, setOver] = createSignal(false);
  return (
    <label class="upload" classList={{ dragover: over() }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); props.onFiles?.([...e.dataTransfer.files]); }}>
      <input type="file" multiple={props.multiple} hidden
        onChange={(e) => props.onFiles?.([...e.currentTarget.files])} />
      <Package />
      <span>{props.hint || "Drop files or browse"}</span>
    </label>
  );
};


/* Toast store */

const [toasts, setToasts] = createSignal([]);

export const toast = (message, tone = "info") => {
  const id = Date.now() + Math.random();
  setToasts((t) => [...t, { id, message, tone }]);
  setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
};

export const Toasts = () => (
  <div class="toast-area">
    <For each={toasts()}>{(t) => <div classList={{ "toast": true, [t.tone]: true }}>{t.message}</div>}</For>
  </div>
);


