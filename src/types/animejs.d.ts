declare module 'animejs' {
    export function animate(targets: any, params: any): any;
    export function stagger(value: any, options?: any): any;
    export class Timeline {
        constructor(params?: any);
        add(targets: any, params: any, offset?: any): Timeline;
    }
}
