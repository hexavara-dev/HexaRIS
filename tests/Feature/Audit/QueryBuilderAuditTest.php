<?php

use App\Audit\AuditLogger;
use App\Audit\Models\AuditActivity;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    Schema::create('legacy_orders', function (Blueprint $table) {
        $table->id();
        $table->string('status');
    });
});

it('audits a raw Query Builder update via explicit logging', function () {
    $id = DB::table('legacy_orders')->insertGetId(['status' => 'pending']);

    $before = (array) DB::table('legacy_orders')->find($id);
    DB::table('legacy_orders')->where('id', $id)->update(['status' => 'approved']);
    $after = (array) DB::table('legacy_orders')->find($id);

    AuditLogger::atomic()
        ->subject('legacy_orders', $id)
        ->before($before)
        ->after($after)
        ->event('updated')
        ->module('Legacy')
        ->log('Legacy order approved');

    $row = AuditActivity::where('subject_type', 'legacy_orders')->where('subject_id', $id)->first();
    expect($row->attribute_changes['old']['status'])->toBe('pending')
        ->and($row->attribute_changes['new']['status'])->toBe('approved')
        ->and($row->properties['module'])->toBe('Legacy');
});
