<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" href="/favicon.svg" type="image/svg+xml">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @routes
        @viteReactRefresh
        {{-- Eager-load the page chunk for app pages; module pages (namespaced "Module::pages/...")
             are resolved lazily by the Inertia glob resolver and have no matching root path. --}}
        @php
            $pageEntry = ! str_contains($page['component'], '::')
                ? "resources/js/pages/{$page['component']}.tsx"
                : null;
        @endphp
        @vite(array_filter(['resources/js/app.tsx', $pageEntry]))
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
