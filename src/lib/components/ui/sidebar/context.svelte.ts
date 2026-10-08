import { getContext, setContext } from 'svelte';

interface SidebarStateProps {
  open: () => boolean;
  overlay: () => boolean;
  setOpen: (open: boolean) => void;
}

class SidebarState {
  readonly props: SidebarStateProps;
  open = $derived.by(() => this.props.open());
  overlay = $derived.by(() => this.props.overlay());
  state = $derived.by(() => (this.open ? 'expanded' : 'collapsed'));

  constructor(props: SidebarStateProps) {
    this.props = props;
  }

  setOpen = (open: boolean) => this.props.setOpen(open);
  toggle = () => this.setOpen(!this.open);
}

const SIDEBAR_CONTEXT = Symbol('sidebar');

export function setSidebar(props: SidebarStateProps): SidebarState {
  return setContext(SIDEBAR_CONTEXT, new SidebarState(props));
}

export function useSidebar(): SidebarState {
  return getContext(SIDEBAR_CONTEXT);
}
